import { createHash } from "node:crypto";
import { open } from "node:fs/promises";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { HopperCancelledError, HopperStartError, } from "../domain/hopperErrors.js";
import { err, ok } from "../domain/result.js";
import { OwnedFileHandle } from "../filesystem/OwnedFileHandle.js";
import { readFileHandleChunks } from "../filesystem/readFileHandleChunks.js";
const defaultFileSystem = { open };
/** Bind ordinary executable opens to the selected digest before Hopper sees a path. */
export const prepareHopperExecutableImage = async (sourcePath, sourceSha256, destination, options) => {
    const hash = createHash("sha256");
    const copied = await copyHopperSource({
        sourcePath,
        destination,
        resourceScope: options.resourceScope,
        fileSystem: options.fileSystem,
        signal: options.signal,
        observer: options.observer,
        selectBytes: (bytes) => {
            hash.update(bytes);
            return bytes;
        },
        failureContext: `Cannot prepare the selected executable from ${sourcePath}`,
    });
    if (!copied.ok)
        return copied;
    const observed = hash.digest("hex");
    if (observed !== sourceSha256)
        return err(new HopperStartError({
            userMessage: `Executable source ${sourcePath} changed before launch: expected SHA-256 ${sourceSha256}, observed ${observed}. Open the stable source again.`,
        }));
    return options.signal?.aborted
        ? err(new HopperCancelledError(options.signal.reason))
        : ok(destination);
};
/** Own source/output handles and copy finalization for every prepared executable layout. */
export const copyHopperSource = async (options) => {
    if (options.signal?.aborted)
        return err(new HopperCancelledError(options.signal.reason));
    const operation = await performHopperImageCopy(options);
    const cancellationBeforeFinalization = operation.cancelled.cancelled
        ? operation.cancelled
        : options.signal?.aborted === true
            ? { cancelled: true, reason: options.signal.reason }
            : { cancelled: false };
    const finalization = await closeHopperImageHandles(operation, options);
    const cancelled = cancellationBeforeFinalization.cancelled ||
        (finalization.closeFailures.length === 0 &&
            options.signal?.aborted === true);
    const cancelReason = cancellationBeforeFinalization.cancelled
        ? cancellationBeforeFinalization.reason
        : options.signal?.reason;
    if (!operation.operationFailure.failed &&
        !cancelled &&
        finalization.closeFailures.length === 0)
        return ok(operation.copied);
    return hopperImageCopyFailure({
        operation,
        finalization,
        failureContext: options.failureContext,
        cancelled,
        cancelReason,
    });
};
const performHopperImageCopy = async (options) => {
    let copied = 0;
    let source;
    let output;
    try {
        source = new OwnedFileHandle(await (options.fileSystem ?? defaultFileSystem).open(options.sourcePath, "r"));
        output = new OwnedFileHandle(await (options.fileSystem ?? defaultFileSystem).open(options.destination, "wx", 0o600));
    }
    catch (cause) {
        return {
            copied,
            operationFailure: { failed: true, cause },
            cancelled: { cancelled: false },
            source,
            output,
        };
    }
    try {
        let position = 0;
        for await (const bytes of readFileHandleChunks(source.handle)) {
            if (options.signal?.aborted)
                return {
                    copied,
                    operationFailure: { failed: false },
                    cancelled: { cancelled: true, reason: options.signal.reason },
                    source,
                    output,
                };
            const selected = options.selectBytes(bytes, position);
            if (selected !== undefined && selected.length > 0) {
                await output.handle.writeFile(selected);
                copied += selected.length;
                await options.observer?.afterChunkWritten?.(copied);
            }
            position += bytes.length;
        }
        return {
            copied,
            operationFailure: { failed: false },
            cancelled: { cancelled: false },
            source,
            output,
        };
    }
    catch (cause) {
        return {
            copied,
            operationFailure: { failed: true, cause },
            cancelled: { cancelled: false },
            source,
            output,
        };
    }
};
const closeHopperImageHandles = async (operation, options) => {
    const closeFailures = [];
    const retained = [];
    const close = async (owner, resource) => {
        if (owner === undefined)
            return;
        try {
            await owner.close();
        }
        catch (cause) {
            closeFailures.push({ resource, cause });
            const attempt = await options.resourceScope.release({
                kind: "file-handle",
                resource,
                handle: owner,
            });
            if (attempt.kind === "failed")
                retained.push(attempt);
        }
    };
    await close(operation.output, `hopper-prepared-image:${options.destination}`);
    await close(operation.source, `hopper-image-source:${options.sourcePath}`);
    return { closeFailures, retained };
};
const hopperImageCopyFailure = (options) => {
    const { operation, finalization } = options;
    const cleanupErrors = finalization.retained.map((attempt) => {
        const cleanupError = new ProviderCleanupError("hopper", [attempt.owner.resource], {
            reason: attempt.cause instanceof Error
                ? attempt.cause.message
                : String(attempt.cause),
        }, { cause: attempt.cause });
        attempt.lease.bindCleanupError(cleanupError);
        return cleanupError;
    });
    const cleanup = cleanupErrors.length === 0
        ? undefined
        : {
            reason: cleanupErrors.map((failure) => failure.message).join("; "),
            resources: [
                ...new Set(cleanupErrors.flatMap((failure) => failure.cleanupResources)),
            ],
        };
    const primaryFailure = operation.operationFailure.failed
        ? operation.operationFailure.cause
        : finalization.closeFailures[0]?.cause;
    const resultError = options.cancelled && !operation.operationFailure.failed
        ? new HopperCancelledError(options.cancelReason, cleanup === undefined ? {} : { cleanup })
        : new HopperStartError({
            ...(operation.operationFailure.failed ||
                finalization.closeFailures.length > 0
                ? { cause: primaryFailure }
                : {}),
            userMessage: `${options.failureContext}: ${primaryFailure instanceof Error ? primaryFailure.message : String(primaryFailure ?? "caller cancellation")}`,
            ...(cleanup === undefined ? {} : { cleanup }),
        });
    for (const closeFailure of finalization.closeFailures) {
        if (!operation.operationFailure.failed &&
            !options.cancelled &&
            closeFailure === finalization.closeFailures[0])
            continue;
        resultError.retainSecondaryFailure(new HopperStartError({
            cause: closeFailure.cause,
            userMessage: `Could not confirm closure of ${closeFailure.resource}.`,
        }));
    }
    for (const cleanupError of cleanupErrors)
        resultError.retainSecondaryFailure(cleanupError);
    if (cleanupErrors.length > 0)
        resultError.bindCleanupDependencies(cleanupErrors);
    return err(resultError);
};

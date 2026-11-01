import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { readStableArtifact } from "../artifacts/readStableArtifact.js";
import { artifactFilePrimaryFacts, artifactSelectedPathErrno, bindArtifactFileCleanup, artifactFileCancellationCause, } from "../artifacts/ArtifactFileOperation.js";
import { ArtifactResourceScope } from "../artifacts/ArtifactResourceScope.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { ArtifactOperationError } from "../domain/artifactOperationError.js";
import { AnalysisAccessDeniedError, AnalysisArtifactChangedError, AnalysisCancelledError, AnalysisInputError, AnalysisResourceConstraintError, } from "../domain/analysisErrorCore.js";
import { MAX_INSPECT_ERLANG_BEAM_ATOMS, MAX_INSPECT_ERLANG_BEAM_CHUNKS, MAX_INSPECT_ERLANG_BEAM_FILE_BYTES, } from "../domain/erlang/beam.js";
import { err, ok } from "../domain/result.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { BeamCapacityFailure, parseErlangBeam } from "./BeamParser.js";
/** Bundled format reader identity; module names are separate observed facts. */
export const ERLANG_BEAM_PROVIDER_IDENTITY = {
    id: "rea-erlang-beam",
    name: "REA Erlang BEAM reader",
    version: "1",
};
const OPERATION = "inspect_erlang_beam";
/** Portable parser over one bounded, identity-checked regular file. */
export class BeamProvider {
    identity = ERLANG_BEAM_PROVIDER_IDENTITY;
    #resources = new ArtifactResourceScope();
    async close() {
        try {
            await this.#resources.close();
        }
        catch (cause) {
            if (!(cause instanceof ArtifactReaderFailure) ||
                cause.cleanup === undefined)
                throw cause;
            const error = new ProviderCleanupError(ERLANG_BEAM_PROVIDER_IDENTITY.id, cause.cleanup.resources, { reason: cause.cleanup.reason }, { cause, operation: OPERATION });
            bindArtifactFileCleanup(cause, error);
            throw error;
        }
    }
    async inspect(input, options) {
        try {
            return await this.#resources.run(async () => {
                const snapshot = await readStableArtifact(input.path, input.max_file_bytes, options?.signal, undefined, this.#resources);
                return ok(parseErlangBeam(snapshot.bytes, {
                    path: input.path,
                    sha256: snapshot.sha256,
                    bytes: snapshot.bytes.length,
                }, input));
            });
        }
        catch (cause) {
            return err(beamFailure(cause, input));
        }
    }
}
const inputBudgetRemediation = (cause, input) => {
    if (cause.boundary === "file-size")
        return input.max_file_bytes >= MAX_INSPECT_ERLANG_BEAM_FILE_BYTES
            ? `The file exceeds the ${String(MAX_INSPECT_ERLANG_BEAM_FILE_BYTES)}-byte input ceiling this operation accepts; select a smaller artifact.`
            : `Raise max_file_bytes above ${String(input.max_file_bytes)} bytes or select a smaller artifact; the limit is the caller-selected input read budget.`;
    if (!(cause instanceof BeamCapacityFailure))
        return undefined;
    switch (cause.resource) {
        case "atoms":
            return cause.maximum >= MAX_INSPECT_ERLANG_BEAM_ATOMS
                ? `The file exceeds the ${String(MAX_INSPECT_ERLANG_BEAM_ATOMS)}-atom ceiling this operation accepts; select a smaller artifact.`
                : `Raise max_atoms above ${String(cause.maximum)} or select a smaller artifact; the limit is the caller-selected atom budget.`;
        case "table-rows":
            return `The file exceeds the ${String(cause.maximum)}-row ceiling this operation accepts; select a smaller artifact.`;
        case "chunks":
            return cause.maximum >= MAX_INSPECT_ERLANG_BEAM_CHUNKS
                ? `The file exceeds the ${String(MAX_INSPECT_ERLANG_BEAM_CHUNKS)}-chunk ceiling this operation accepts; select a smaller artifact.`
                : `Raise max_chunks above ${String(cause.maximum)} or select a smaller artifact; the limit is the caller-selected chunk budget.`;
    }
};
const beamFailurePrimary = (facts, input) => {
    const { cause, origin } = facts;
    if (origin === "owned-or-classified" &&
        cause instanceof ArtifactReaderFailure &&
        cause.reason === "integrity")
        return new AnalysisArtifactChangedError(OPERATION, input.path, cause.message, {
            cause,
        });
    if (origin === "owned-or-classified" &&
        cause instanceof ArtifactReaderFailure &&
        cause.reason === "cancelled")
        return new AnalysisCancelledError(OPERATION, {
            cause: artifactFileCancellationCause(cause),
        });
    if (origin === "owned-or-classified" &&
        cause instanceof ArtifactReaderFailure) {
        if (cause.reason === "limit") {
            const remediationAction = inputBudgetRemediation(cause, input);
            return new AnalysisResourceConstraintError(OPERATION, cause.boundary ?? "memory", cause.message, {
                max_file_bytes: input.max_file_bytes,
                max_chunks: input.max_chunks,
                max_atoms: input.max_atoms,
            }, {
                cause,
                ...(remediationAction === undefined
                    ? {}
                    : {
                        retryable: false,
                        remediationAction,
                    }),
            });
        }
        if (cause.reason === "path" || cause.reason === "format")
            return new AnalysisInputError(OPERATION, { cause }, [
                {
                    path: ["path"],
                    reason: "invalid_format",
                    message: cause.message,
                },
            ]);
    }
    if (cause instanceof Error && "code" in cause) {
        if (cause.code === "EACCES" || cause.code === "EPERM")
            return new AnalysisAccessDeniedError(OPERATION, input.path, cause.code, {
                cause,
            });
        const pathErrno = artifactSelectedPathErrno(cause);
        if (pathErrno !== undefined)
            return new AnalysisInputError(OPERATION, { cause }, [
                {
                    path: ["path"],
                    reason: "invalid_value",
                    message: `Selected BEAM file could not be read (${pathErrno}): ${input.path}.`,
                },
            ]);
    }
    return new ArtifactOperationError(OPERATION, origin === "owned-or-classified" && cause instanceof ArtifactReaderFailure
        ? cause.reason
        : "io", undefined, cause instanceof Error ? cause.message : "BEAM inspection failed.", { cause });
};
const beamFailure = (cause, input) => {
    const primary = beamFailurePrimary(artifactFilePrimaryFacts(cause), input);
    if (!(cause instanceof ArtifactReaderFailure) || cause.cleanup === undefined)
        return primary;
    const cleanup = new ProviderCleanupError(ERLANG_BEAM_PROVIDER_IDENTITY.id, cause.cleanup.resources, { reason: cause.cleanup.reason }, { operation: OPERATION, cause });
    const error = analysisErrorWithCleanupFailure(primary, cleanup, OPERATION);
    bindArtifactFileCleanup(cause, error);
    return error;
};

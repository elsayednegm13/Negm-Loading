import { assertArtifactReadActive } from "./ArtifactFileOperation.js";
import { ArtifactReaderFailure } from "./ArtifactReader.js";
import { err, ok } from "../domain/result.js";
import { ASAR_HEADER_ADMISSION_SETTING, DEFAULT_ASAR_HEADER_ADMISSION, DEFAULT_ASAR_MAX_HEADER_BYTES, MAXIMUM_ASAR_MAX_HEADER_BYTES, parseAsarHeaderAdmission, } from "../config/asarHeaderAdmission.js";
/**
 * Resolve the admission from a composition root's selected environment; an
 * invalid setting is refused, not ignored. Callers without an environment use
 * the default.
 */
export const resolveAsarHeaderAdmission = (environment) => {
    const parsed = parseAsarHeaderAdmission(environment[ASAR_HEADER_ADMISSION_SETTING]);
    if (!parsed.ok)
        throw parsed.error;
    return parsed.value;
};
const MEBIBYTE = 1024 * 1024;
const byteAllowance = (bytes) => {
    const mebibytes = bytes / MEBIBYTE;
    return Number.isInteger(mebibytes)
        ? `${String(mebibytes)} MiB / ${String(bytes)} bytes`
        : `${String(bytes)} bytes`;
};
/** User-visible recovery for the effective ASAR header/index admission budget. */
export const asarHeaderAdmissionRecovery = (admission) => [
    `ASAR header/index admission is limited to ${byteAllowance(admission.maximumBytes)}${admission.source === "setting" ? ` by ${ASAR_HEADER_ADMISSION_SETTING}` : ""}.`,
    `On MCP, call update_analysis_settings with setting asar.max_header_bytes, action set, and a value in bytes up to ${byteAllowance(MAXIMUM_ASAR_MAX_HEADER_BYTES)} (default ${byteAllowance(DEFAULT_ASAR_MAX_HEADER_BYTES)}), then retry the original request. It applies to the next operation without restarting REA. For CLI or future REA processes, set ${ASAR_HEADER_ADMISSION_SETTING} in the launch environment.`,
    "Selecting fewer sources or narrowing an internal path does not bypass header admission, because the archive index is read before any member can be selected.",
    "Raising max_heap_mb or available host memory does not raise it.",
    "Alternatively, analyze an extracted application directory, which does not admit an ASAR header.",
    "Repeating the unchanged request fails the same way.",
].join(" ");
/** Refuse an ASAR whose header/index exceeds the effective admission budget. */
export const asarHeaderAdmissionFailure = (admission, requiredBytes) => new ArtifactReaderFailure("limit", asarHeaderAdmissionRecovery(admission), {
    admission: {
        kind: "asar-header",
        ...admission,
        ...(requiredBytes === undefined ? {} : { requiredBytes }),
    },
});
/** Absolute archive prefix required to inspect a header under this admission. */
const asarHeaderProbeBytes = (admission) => admission.maximumBytes + 8;
/**
 * Parse the fixed two-Pickle prefix and optionally check it against the actual
 * observed archive size. This establishes byte extents only; JSON validity and
 * the ASAR header schema belong to the decoder at the interpretation boundary.
 */
const parseAsarHeaderExtents = (prefix, archiveBytes) => {
    if (prefix.byteLength < 16)
        return err(new ArtifactReaderFailure("format", "Truncated ASAR Pickle extent prefix"));
    const bytes = Buffer.from(prefix.buffer, prefix.byteOffset, 16);
    const headerBytes = bytes.readUInt32LE(4);
    const payloadBytes = bytes.readUInt32LE(8);
    const jsonBytes = bytes.readUInt32LE(12);
    if (bytes.readUInt32LE(0) !== 4 ||
        headerBytes < 8 ||
        payloadBytes !== headerBytes - 4 ||
        jsonBytes > payloadBytes - 4)
        return err(new ArtifactReaderFailure("format", "ASAR header has invalid Pickle extents"));
    if (archiveBytes !== undefined &&
        (!Number.isSafeInteger(archiveBytes) ||
            archiveBytes < 8 ||
            headerBytes > archiveBytes - 8))
        return err(new ArtifactReaderFailure("format", "ASAR header leaves its observed container"));
    return ok({ headerBytes, jsonBytes });
};
class AsarHeaderSignatureProbeImpl {
    admission;
    limit;
    #fixed = Buffer.alloc(16);
    #fixedBytes = 0;
    #scannedJsonBytes = 0;
    #extents;
    #stop = { state: "pending" };
    constructor(admission) {
        this.admission = admission;
        this.limit = asarHeaderProbeBytes(admission);
    }
    get observation() {
        return this.#observation();
    }
    /** Consume sequential archive bytes without retaining JSON or member data. */
    write(input) {
        if (this.#stop.state === "finalized")
            return this.#stop.observation;
        const bytes = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
        let offset = 0;
        while (offset < bytes.length && !this.#isTerminal()) {
            if (this.#fixedBytes < this.#fixed.length) {
                const count = Math.min(this.#fixed.length - this.#fixedBytes, bytes.length - offset);
                bytes.copy(this.#fixed, this.#fixedBytes, offset, offset + count);
                this.#fixedBytes += count;
                offset += count;
                if (this.#fixedBytes === this.#fixed.length)
                    this.#parseFixed();
                continue;
            }
            const extents = this.#extents;
            if (extents === undefined || this.#stop.state === "matched")
                break;
            const jsonRemaining = extents.jsonBytes - this.#scannedJsonBytes;
            if (jsonRemaining <= 0) {
                this.#stop = { state: "rejected", reason: "json-not-object" };
                break;
            }
            const archiveBytesScanned = 16 + this.#scannedJsonBytes;
            if (archiveBytesScanned >= this.limit) {
                this.#stop = { state: "limit" };
                break;
            }
            const count = Math.min(bytes.length - offset, jsonRemaining, this.limit - archiveBytesScanned);
            for (let index = 0; index < count; index += 1) {
                const value = bytes[offset + index];
                if (!isJsonWhitespace(value)) {
                    if (value === 0x7b)
                        this.#stop = {
                            state: "matched",
                            signatureOffset: 16 + this.#scannedJsonBytes,
                            extents,
                        };
                    else
                        this.#stop = { state: "rejected", reason: "json-not-object" };
                    break;
                }
                this.#scannedJsonBytes += 1;
            }
            offset += count;
            if (this.#stop.state !== "pending")
                break;
            if (this.#scannedJsonBytes >= extents.jsonBytes) {
                this.#stop = { state: "rejected", reason: "json-not-object" };
                break;
            }
            if (16 + this.#scannedJsonBytes >= this.limit)
                this.#stop = { state: "limit" };
        }
        return this.#observation();
    }
    /** Finalize against the actual byte count; a signature alone is not validity. */
    finish(archiveBytes) {
        if (this.#stop.state === "finalized")
            return this.#stop.observation;
        if (this.#fixedBytes < this.#fixed.length) {
            this.#stop = { state: "rejected", reason: "invalid-pickle-extents" };
        }
        else if (this.#extents !== undefined) {
            if (!Number.isSafeInteger(archiveBytes) ||
                archiveBytes < 8 ||
                this.#extents.headerBytes > archiveBytes - 8) {
                this.#stop = { state: "rejected", reason: "archive-too-short" };
            }
            else if (this.#extents.headerBytes > this.admission.maximumBytes &&
                this.#stop.state === "matched") {
                this.#stop = { state: "limit" };
            }
        }
        const observation = this.#observation(archiveBytes);
        this.#stop = { state: "finalized", observation };
        return observation;
    }
    #parseFixed() {
        const result = parseAsarHeaderExtents(this.#fixed);
        if (!result.ok) {
            this.#stop = { state: "rejected", reason: "invalid-pickle-extents" };
            return;
        }
        this.#extents = result.value;
        if (this.#extents.jsonBytes === 0)
            this.#stop = { state: "rejected", reason: "json-not-object" };
    }
    #isTerminal() {
        return this.#stop.state !== "pending";
    }
    #observation(archiveBytes) {
        if (this.#stop.state === "finalized")
            return this.#stop.observation;
        const extents = this.#extents === undefined
            ? undefined
            : archiveBytes === undefined
                ? this.#extents
                : { archiveBytes, ...this.#extents };
        switch (this.#stop.state) {
            case "rejected":
                return {
                    state: "rejected",
                    reason: this.#stop.reason,
                    ...(extents === undefined ? {} : { extents }),
                    scannedJsonBytes: this.#scannedJsonBytes,
                };
            case "limit":
                return {
                    state: "limit",
                    ...(extents === undefined ? {} : { extents }),
                    scannedJsonBytes: this.#scannedJsonBytes,
                    limitBytes: this.limit,
                    admission: this.admission,
                };
            case "matched":
                return {
                    state: "matched",
                    extents: archiveBytes === undefined
                        ? this.#stop.extents
                        : { archiveBytes, ...this.#stop.extents },
                    signatureOffset: this.#stop.signatureOffset,
                    scannedJsonBytes: this.#scannedJsonBytes,
                };
            case "pending":
                if (archiveBytes !== undefined && this.#extents !== undefined) {
                    const finalizedExtents = {
                        archiveBytes,
                        ...this.#extents,
                    };
                    if (this.#scannedJsonBytes >= this.#extents.jsonBytes)
                        return {
                            state: "rejected",
                            reason: "json-not-object",
                            extents: finalizedExtents,
                            scannedJsonBytes: this.#scannedJsonBytes,
                        };
                    return {
                        state: "limit",
                        extents: finalizedExtents,
                        scannedJsonBytes: this.#scannedJsonBytes,
                        limitBytes: this.limit,
                        admission: this.admission,
                    };
                }
                return {
                    state: "pending",
                    ...(extents === undefined ? {} : { extents }),
                    scannedJsonBytes: this.#scannedJsonBytes,
                };
        }
    }
}
const isJsonWhitespace = (value) => value === 0x20 || value === 0x09 || value === 0x0a || value === 0x0d;
/** Admit Pickle extents before an upstream decoder allocates them. */
export const admitAsarHeader = async (handle, signal, admission = DEFAULT_ASAR_HEADER_ADMISSION) => {
    assertArtifactReadActive(signal);
    const observed = await handle.stat();
    assertArtifactReadActive(signal);
    if (!observed.isFile())
        throw new ArtifactReaderFailure("format", "ASAR container is not a regular file");
    const prefix = Buffer.alloc(16);
    let bytesRead = 0;
    while (bytesRead < prefix.length) {
        assertArtifactReadActive(signal);
        const read = await handle.read(prefix, bytesRead, prefix.length - bytesRead, bytesRead);
        assertArtifactReadActive(signal);
        if (read.bytesRead === 0)
            throw new ArtifactReaderFailure("format", "Truncated ASAR size pickle");
        bytesRead += read.bytesRead;
    }
    const parsed = parseAsarHeaderExtents(prefix, observed.size);
    if (!parsed.ok)
        throw parsed.error;
    if (parsed.value.headerBytes > admission.maximumBytes)
        throw asarHeaderAdmissionFailure(admission, parsed.value.headerBytes);
    return {
        archiveBytes: observed.size,
        ...parsed.value,
    };
};
export const createAsarHeaderSignatureProbe = (admission = DEFAULT_ASAR_HEADER_ADMISSION) => new AsarHeaderSignatureProbeImpl(admission);

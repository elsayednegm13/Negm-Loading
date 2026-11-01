import { createAsarHeaderSignatureProbe, } from "./AsarHeader.js";
import { createXmlPlistSignatureProbe, MAX_XML_PLIST_PROBE_BYTES, } from "../domain/apple/appleArchiveFormat.js";
import { readFatContainerHeader, readFatContainerTable, readMachoHeaderPrefixFacts, } from "../domain/apple/machoContainer.js";
import { observeMzWindowsHeader, } from "../domain/dosMz.js";
/** Initial bytes required by the other bounded format classifiers. */
export const ARTIFACT_CLASSIFICATION_PREFIX_BYTES = 8_192;
const observeFatSliceHeaders = (input) => {
    const { table, observedHeaders, partialHeaders, streamOffset, bytes } = input;
    if (table?.state !== "parsed")
        return;
    for (const slice of table.slices) {
        if (observedHeaders.has(slice.offset) && !partialHeaders.has(slice.offset))
            continue;
        const headerLength = Math.min(12, slice.size);
        const headerEnd = slice.offset + headerLength;
        if (!Number.isSafeInteger(headerEnd))
            continue;
        const start = Math.max(slice.offset, streamOffset);
        const end = Math.min(headerEnd, streamOffset + bytes.length);
        if (start >= end)
            continue;
        let pending = partialHeaders.get(slice.offset);
        if (pending === undefined) {
            pending = { bytes: Buffer.alloc(12), count: 0 };
            partialHeaders.set(slice.offset, pending);
        }
        Buffer.from(bytes.subarray(start - streamOffset, end - streamOffset)).copy(pending.bytes, start - slice.offset);
        pending.count += end - start;
        observedHeaders.set(slice.offset, readMachoHeaderPrefixFacts(pending.bytes.subarray(0, Math.min(pending.count, headerLength))));
        if (pending.count === headerLength) {
            partialHeaders.delete(slice.offset);
        }
    }
};
const finishClassificationEvidence = (prefix, archiveBytes, finishAsar, sliceHeadersByOffset, mzWindowsHeaderSignature) => {
    const finalHeader = readFatContainerHeader(prefix, archiveBytes);
    if (finalHeader.state === "parsed") {
        for (let index = 0; index < finalHeader.slices.length; index += 1) {
            const slice = finalHeader.slices[index];
            if (slice === undefined || sliceHeadersByOffset.has(slice.offset))
                continue;
            const available = Math.max(0, Math.min(slice.size, prefix.length - slice.offset));
            if (available === 0)
                continue;
            sliceHeadersByOffset.set(slice.offset, readMachoHeaderPrefixFacts(prefix.subarray(slice.offset, slice.offset + available)));
        }
    }
    const fatSliceHeaders = finalHeader.state === "parsed"
        ? { header: finalHeader, sliceHeadersByOffset }
        : undefined;
    return {
        prefix,
        asarHeader: finishAsar(archiveBytes),
        ...(fatSliceHeaders === undefined ? {} : { fatSliceHeaders }),
        ...(mzWindowsHeaderSignature === undefined
            ? {}
            : { mzWindowsHeaderSignature }),
    };
};
/** Share acquisition bounds and signature observations across files and streams. */
export const createArtifactClassificationProbe = (asarHeaderAdmission) => {
    const xml = createXmlPlistSignatureProbe();
    const asar = createAsarHeaderSignatureProbe(asarHeaderAdmission);
    const blocks = [];
    let retainedBytes = 0;
    let observedBytes = 0;
    let fatTable;
    const fatSliceHeadersByOffset = new Map();
    const partialFatHeaders = new Map();
    let mzWindowsHeaderSignature;
    let mzWindowsHeaderOffset;
    let mzHeaderChecked = false;
    const observeSignatureWindow = (offset, sourceOffset, sourceBytes) => {
        if (!Number.isSafeInteger(offset) || offset < 0)
            return;
        const start = Math.max(offset, sourceOffset);
        const end = Math.min(offset + 4, sourceOffset + sourceBytes.length);
        if (start >= end)
            return;
        const window = Buffer.alloc(4);
        const previous = mzWindowsHeaderSignature?.offset === offset
            ? mzWindowsHeaderSignature.bytes
            : undefined;
        previous?.copy(window);
        let observedLength = previous?.length ?? 0;
        if (start < end && start <= offset + observedLength) {
            Buffer.from(sourceBytes.subarray(start - sourceOffset, end - sourceOffset)).copy(window, start - offset);
            observedLength = Math.max(observedLength, end - offset);
        }
        if (observedLength === 0)
            return;
        mzWindowsHeaderSignature = {
            offset,
            bytes: window.subarray(0, observedLength),
        };
    };
    const retain = (bytes) => {
        let offset = 0;
        while (offset < bytes.length) {
            const blockOffset = retainedBytes % ARTIFACT_CLASSIFICATION_PREFIX_BYTES;
            if (blockOffset === 0)
                blocks.push(Buffer.allocUnsafe(ARTIFACT_CLASSIFICATION_PREFIX_BYTES));
            const count = Math.min(ARTIFACT_CLASSIFICATION_PREFIX_BYTES - blockOffset, bytes.length - offset);
            blocks[blocks.length - 1].set(bytes.subarray(offset, offset + count), blockOffset);
            retainedBytes += count;
            offset += count;
        }
    };
    const retainedPrefix = () => {
        const prefix = Buffer.allocUnsafe(retainedBytes);
        let copied = 0;
        for (const block of blocks) {
            const count = Math.min(block.length, retainedBytes - copied);
            prefix.set(block.subarray(0, count), copied);
            copied += count;
        }
        return prefix;
    };
    return {
        get length() {
            return observedBytes;
        },
        get limit() {
            if (observedBytes < ARTIFACT_CLASSIFICATION_PREFIX_BYTES)
                return ARTIFACT_CLASSIFICATION_PREFIX_BYTES;
            return Math.max(ARTIFACT_CLASSIFICATION_PREFIX_BYTES, xml.state === "pending" ? MAX_XML_PLIST_PROBE_BYTES : 0, asar.observation.state === "pending" ? asar.limit : 0);
        },
        write(bytes) {
            const streamOffset = observedBytes;
            asar.write(bytes);
            let offset = 0;
            while (offset < bytes.length) {
                const limit = retainedBytes < ARTIFACT_CLASSIFICATION_PREFIX_BYTES
                    ? ARTIFACT_CLASSIFICATION_PREFIX_BYTES
                    : xml.state === "pending"
                        ? MAX_XML_PLIST_PROBE_BYTES
                        : retainedBytes;
                if (retainedBytes >= limit)
                    break;
                const selected = bytes.subarray(offset, offset + Math.min(limit - retainedBytes, bytes.length - offset));
                retain(selected);
                xml.write(selected);
                offset += selected.length;
            }
            if ((fatTable === undefined || fatTable.state === "needs-data") &&
                retainedBytes >= 8)
                fatTable = readFatContainerTable(retainedPrefix());
            observeFatSliceHeaders({
                table: fatTable,
                observedHeaders: fatSliceHeadersByOffset,
                partialHeaders: partialFatHeaders,
                streamOffset,
                bytes,
            });
            if (!mzHeaderChecked && retainedBytes >= 64) {
                mzHeaderChecked = true;
                const prefix = retainedPrefix();
                if (prefix[0] === 0x4d && prefix[1] === 0x5a) {
                    const windowsHeader = observeMzWindowsHeader(prefix, Number.MAX_SAFE_INTEGER);
                    if (windowsHeader.state === "signature-needed") {
                        mzWindowsHeaderOffset = windowsHeader.offset;
                        if (windowsHeader.offset < prefix.length) {
                            const inline = prefix.subarray(windowsHeader.offset, Math.min(windowsHeader.offset + 4, prefix.length));
                            mzWindowsHeaderSignature = {
                                offset: windowsHeader.offset,
                                bytes: inline,
                            };
                        }
                    }
                }
            }
            if (mzWindowsHeaderOffset !== undefined)
                observeSignatureWindow(mzWindowsHeaderOffset, streamOffset, bytes);
            observedBytes += bytes.length;
        },
        finish(archiveBytes) {
            return finishClassificationEvidence(retainedPrefix(), archiveBytes, (bytes) => asar.finish(bytes), fatSliceHeadersByOffset, mzWindowsHeaderSignature);
        },
    };
};

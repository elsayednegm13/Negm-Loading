import { createSwiftContextReader, } from "./AppleSwiftNominalTypes.js";
import { expectedSwiftMetadataReadFailure } from "./AppleSwiftMetadataReadFailure.js";
const hex = (value) => `0x${value.toString(16)}`;
export const swiftImportBinding = (requestedAddress, binding) => ({
    requested_address: hex(requestedAddress),
    symbol: binding.symbol,
    binding_source: binding.binding_source,
    library_ordinal: binding.library_ordinal,
    library: binding.library,
    weak: binding.weak,
    addend: binding.addend.toString(),
});
const typeReferenceResult = (input) => ({
    kind: input.kind,
    target: input.target,
    name: input.name ?? null,
    module: input.module ?? null,
    binding: input.binding ?? null,
    reason: input.reason ?? null,
    staticWitnessIdentity: input.name !== null && input.name !== undefined && input.kind <= 2,
    generic: input.generic ?? null,
});
export const requiredSwiftRelativeTarget = (relative, field, kind, unresolvedReason) => {
    const value = relative(field, kind);
    if (value.kind !== "target")
        throw new RangeError(unresolvedReason(value, kind));
    return value.target;
};
const decodeNominalTypeReference = (kind, input, value) => {
    const { read, relative } = input;
    let target = value.kind === "target" ? value.target : null;
    let binding = value.kind === "binding"
        ? swiftImportBinding(value.requestedAddress, value.binding)
        : null;
    let reason = value.kind === "unknown"
        ? value.reason
        : value.kind === "null"
            ? "Null Swift conformance type reference"
            : null;
    try {
        if (kind === 1 && target !== null) {
            const pointer = read.resolvePointer(target);
            if (pointer.kind === "bind") {
                binding = swiftImportBinding(target, pointer);
                target = null;
            }
            else if (pointer.kind === "raw" && pointer.target === 0n) {
                target = null;
                reason = "Null indirect Swift conformance type reference";
            }
            else if (pointer.kind === "raw" || pointer.kind === "rebase") {
                target = pointer.target;
            }
            else {
                target = null;
                reason = pointer.reason;
            }
        }
        if (target === null)
            return typeReferenceResult({ kind, target, binding, reason });
        const descriptorFlags = read.u32(target);
        if (![16, 17, 18].includes(descriptorFlags & 31))
            return typeReferenceResult({
                kind,
                target,
                binding,
                reason: "Unsupported Swift type descriptor kind",
            });
        const contextReader = input.contextReader ?? createSwiftContextReader({ ...read, relative });
        const name = contextReader.typeName(target);
        const context = contextReader.contextOf(target);
        return typeReferenceResult({
            kind,
            target,
            name: context.path ?? name,
            module: context.module,
            binding,
            reason: context.reason,
            generic: (descriptorFlags & 0x80) !== 0,
        });
    }
    catch (cause) {
        const reason = expectedSwiftMetadataReadFailure(cause);
        if (reason === null)
            throw cause;
        return typeReferenceResult({
            kind,
            target,
            binding,
            reason,
        });
    }
};
const decodeDirectObjcClassName = (kind, read, value) => {
    if (value.kind !== "target")
        return typeReferenceResult({
            kind,
            target: null,
            reason: value.kind === "unknown"
                ? value.reason
                : "Null Swift conformance type reference",
        });
    try {
        const name = read.string(value.target);
        return typeReferenceResult({
            kind,
            target: value.target,
            name: name.length === 0 ? null : name,
            reason: name.length === 0 ? "Empty inline Objective-C class name" : null,
        });
    }
    catch (cause) {
        const reason = expectedSwiftMetadataReadFailure(cause);
        if (reason === null)
            throw cause;
        return typeReferenceResult({
            kind,
            target: value.target,
            reason,
        });
    }
};
const decodeIndirectObjcClass = (kind, read, value) => {
    if (value.kind !== "target")
        return typeReferenceResult({
            kind,
            target: null,
            reason: value.kind === "unknown"
                ? value.reason
                : "Null Swift conformance type reference",
        });
    let pointer;
    try {
        pointer = read.resolvePointer(value.target);
    }
    catch (cause) {
        const reason = expectedSwiftMetadataReadFailure(cause);
        if (reason === null)
            throw cause;
        return typeReferenceResult({
            kind,
            target: value.target,
            reason,
        });
    }
    if (pointer.kind === "bind")
        return typeReferenceResult({
            kind,
            target: null,
            binding: swiftImportBinding(value.target, pointer),
            reason: "Indirect Objective-C class metadata requires runtime lookup",
        });
    if (pointer.kind === "raw" || pointer.kind === "rebase")
        return typeReferenceResult({
            kind,
            target: pointer.kind === "raw" && pointer.target === 0n ? null : pointer.target,
            reason: "Indirect Objective-C class metadata requires runtime lookup",
        });
    return typeReferenceResult({
        kind,
        target: null,
        reason: pointer.reason,
    });
};
/** Decode source-encoded class identity; ObjC runtime lookup remains unavailable. */
export const decodeSwiftConformanceTypeReference = (input) => {
    const kind = (input.flags >>> 3) & 7;
    try {
        const value = input.relative(input.descriptor + 4n, "conformanceType");
        switch (kind) {
            case 0:
            case 1:
                return decodeNominalTypeReference(kind, input, value);
            case 2:
                return decodeDirectObjcClassName(kind, input.read, value);
            case 3:
                return decodeIndirectObjcClass(kind, input.read, value);
            default:
                return typeReferenceResult({
                    kind,
                    target: value.kind === "target" ? value.target : null,
                    reason: value.kind === "unknown"
                        ? value.reason
                        : `Unsupported Swift conformance type-reference kind ${kind}`,
                });
        }
    }
    catch (cause) {
        const reason = expectedSwiftMetadataReadFailure(cause);
        if (reason === null)
            throw cause;
        return typeReferenceResult({
            kind,
            target: null,
            reason,
        });
    }
};

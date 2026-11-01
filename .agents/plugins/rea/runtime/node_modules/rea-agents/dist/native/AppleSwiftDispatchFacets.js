import { createSwiftContextReader, } from "./AppleSwiftNominalTypes.js";
import { issue } from "./AppleDispatchDecodeFacts.js";
import { decodeSwiftConformanceTypeReference, requiredSwiftRelativeTarget, swiftImportBinding as importBinding, } from "./AppleSwiftConformanceTypeReference.js";
import { expectedSwiftMetadataReadFailure } from "./AppleSwiftMetadataReadFailure.js";
/** Nullability and storage encoding follow the owning fields in Swift ABI. */
const relativeFieldContracts = {
    conformanceRecord: { encoding: "direct", nullability: "nonnull" },
    conformanceProtocol: {
        encoding: "indirectable",
        nullability: "nullable",
    },
    protocolName: { encoding: "direct", nullability: "nonnull" },
    conformanceType: { encoding: "direct", nullability: "nullable" },
    typeName: { encoding: "direct", nullability: "nonnull" },
    witnessTablePattern: { encoding: "direct", nullability: "nullable" },
    typeMetadataRecord: { encoding: "taggedDirect", nullability: "nonnull" },
    contextParent: { encoding: "indirectable", nullability: "nullable" },
    moduleName: { encoding: "direct", nullability: "nonnull" },
    typeAccessFunction: { encoding: "direct", nullability: "nullable" },
    methodImplementation: {
        encoding: "compactFunction",
        nullability: "nullable",
    },
};
/** Keep ABI null, unavailable values, and unresolved imports distinct. */
export const unresolvedSwiftRelativeReason = (value, field) => {
    if (value.kind === "null")
        return `Null Swift relative pointer for ${field}`;
    if (value.kind === "unknown")
        return value.reason;
    return `Swift relative pointer for ${field} has an unresolved external binding at ${hex(value.requestedAddress)}`;
};
const readSwiftProtocolFacts = (input) => {
    const { target, read } = input;
    if (target === null)
        return {
            name: null,
            readable: false,
            reason: "Protocol descriptor target is unresolved",
        };
    let descriptorKind;
    try {
        descriptorKind = read.u32(target) & 31;
    }
    catch (cause) {
        const reason = expectedSwiftMetadataReadFailure(cause);
        if (reason === null)
            throw cause;
        return { name: null, readable: false, reason };
    }
    if (descriptorKind !== 3)
        return {
            name: null,
            readable: false,
            reason: "Unsupported Swift protocol descriptor kind",
        };
    try {
        const name = input.contextReader.protocolName(target);
        const context = input.contextReader.contextOf(target);
        return {
            name: context.path ?? name,
            readable: true,
            reason: context.reason,
        };
    }
    catch (cause) {
        const reason = expectedSwiftMetadataReadFailure(cause);
        if (reason === null)
            throw cause;
        return { name: null, readable: false, reason };
    }
};
const readWitnessConformanceHeader = (read, witness, descriptor) => {
    try {
        const header = read.resolvePointer(witness);
        if (header.kind !== "raw" && header.kind !== "rebase")
            return header.kind === "unknown" || header.kind === "unsupported"
                ? header.reason
                : "Witness-table conformance header is an external binding";
        return header.target === descriptor
            ? null
            : "Witness-table conformance header is unresolved or encoded";
    }
    catch (cause) {
        const reason = expectedSwiftMetadataReadFailure(cause);
        if (reason === null)
            throw cause;
        return reason;
    }
};
const hex = (value) => `0x${value.toString(16)}`;
const decoded = { status: "decoded", reason: null };
/** Create a Swift ABI signed-relative pointer decoder that records relative_pointers. */
export const createSwiftRelativeReader = (input) => {
    const { bytes, readers: read, budget, result } = input;
    return (field, kind) => {
        const contract = relativeFieldContracts[kind];
        const indirectable = contract.encoding === "indirectable";
        const taggedDirect = contract.encoding === "taggedDirect";
        const nullable = contract.nullability === "nullable";
        const displacement = bytes.readInt32LE(read.offset(field, 4));
        const encodingTag = taggedDirect ? displacement & 3 : undefined;
        if (encodingTag !== undefined && encodingTag !== 0) {
            const reason = `Unsupported Swift type metadata record tag ${encodingTag}`;
            if (budget.admit())
                result.relative_pointers.push({
                    field: read.location(field),
                    target: { address: null, file_offset: null },
                    displacement,
                    indirectable,
                    indirect: false,
                    encoding_tag: encodingTag,
                    decode: { status: "unsupported", reason },
                    evidence: read.evidence(field, "Swift ABI tagged type metadata record"),
                });
            return { kind: "unknown", reason };
        }
        const indirect = indirectable && (displacement & 1) !== 0;
        let target = nullable && displacement === 0
            ? null
            : field +
                BigInt(taggedDirect
                    ? displacement & ~3
                    : indirectable
                        ? displacement & ~1
                        : displacement);
        let fileOffset = null;
        let reason = null;
        try {
            if (indirect && target !== null) {
                const pointer = read.resolvePointer(target);
                if (pointer.kind === "bind") {
                    if (budget.admit())
                        result.relative_pointers.push({
                            field: read.location(field),
                            target: { address: null, file_offset: null },
                            displacement,
                            indirectable,
                            indirect,
                            binding: importBinding(target, pointer),
                            decode: { status: "partial", reason: "External pointer binding" },
                            evidence: read.evidence(field, "Swift ABI indirect relative pointer and Mach-O import binding"),
                        });
                    return {
                        kind: "binding",
                        binding: pointer,
                        requestedAddress: target,
                    };
                }
                if (pointer.kind === "unknown" || pointer.kind === "unsupported") {
                    const unresolved = pointer.reason;
                    if (budget.admit())
                        result.relative_pointers.push({
                            field: read.location(field),
                            target: { address: null, file_offset: null },
                            displacement,
                            indirectable,
                            indirect,
                            decode: { status: "partial", reason: unresolved },
                            evidence: read.evidence(field, "Swift ABI indirect relative pointer"),
                        });
                    return { kind: "unknown", reason: unresolved };
                }
                const indirectTarget = pointer.target;
                target =
                    pointer.kind === "raw" && indirectTarget === 0n
                        ? null
                        : indirectTarget;
            }
            if (target !== null)
                fileOffset = read.offset(target);
        }
        catch (cause) {
            reason = cause instanceof Error ? cause.message : String(cause);
        }
        if (budget.admit())
            result.relative_pointers.push({
                field: read.location(field),
                target: {
                    address: target === null ? null : hex(target),
                    file_offset: fileOffset,
                },
                displacement,
                indirectable,
                indirect,
                ...(encodingTag === undefined ? {} : { encoding_tag: encodingTag }),
                decode: reason === null ? decoded : { status: "partial", reason },
                evidence: read.evidence(field, "Swift ABI signed-relative metadata pointer"),
            });
        return target === null ? { kind: "null" } : { kind: "target", target };
    };
};
/** Decode `__swift5_proto` conformances and static witness slots into `result`. */
export const decodeSwiftDispatchFacets = (input) => {
    const { sections, segments, readers: read, relative, budget, result } = input;
    const contextReader = input.contextReader ?? createSwiftContextReader({ ...read, relative });
    const issues = [];
    let swiftExamined = 0;
    let decodedRecords = 0;
    for (const section of sections.filter(({ name }) => name === "__swift5_proto")) {
        if (section.size % 4 !== 0)
            throw new RangeError("Misaligned Swift conformance section");
        for (let index = 0; index < section.size / 4; index++) {
            if (!budget.admit())
                break;
            swiftExamined++;
            const field = section.address + BigInt(index * 4);
            try {
                const descriptor = requiredSwiftRelativeTarget(relative, field, "conformanceRecord", unresolvedSwiftRelativeReason);
                const flags = read.u32(descriptor + 12n);
                const protocolValue = relative(descriptor, "conformanceProtocol");
                const protocol = protocolValue.kind === "target" ? protocolValue.target : null;
                const unresolvedProtocolReason = protocolValue.kind === "unknown" || protocolValue.kind === "binding"
                    ? unresolvedSwiftRelativeReason(protocolValue, "conformanceProtocol")
                    : null;
                const protocolFacts = readSwiftProtocolFacts({
                    target: protocol,
                    contextReader,
                    read,
                });
                const protocolName = protocolFacts.name;
                const protocolBinding = protocolValue.kind === "binding"
                    ? importBinding(protocolValue.requestedAddress, protocolValue.binding)
                    : null;
                const typeReference = decodeSwiftConformanceTypeReference({
                    descriptor,
                    flags,
                    read,
                    contextReader,
                    relative,
                    unresolvedReason: unresolvedSwiftRelativeReason,
                });
                const witnessValue = relative(descriptor + 8n, "witnessTablePattern");
                const witness = witnessValue.kind === "target" ? witnessValue.target : null;
                const unresolvedWitnessReason = witnessValue.kind === "unknown" || witnessValue.kind === "binding"
                    ? unresolvedSwiftRelativeReason(witnessValue, "witnessTablePattern")
                    : null;
                let staticWitness = witness !== null &&
                    protocol !== null &&
                    protocolFacts.readable &&
                    typeReference.staticWitnessIdentity &&
                    (flags & ~0x38) === 0;
                staticWitness &&=
                    typeReference.kind === 2 || typeReference.generic === false;
                let witnessReason = staticWitness
                    ? null
                    : (unresolvedProtocolReason ??
                        protocolFacts.reason ??
                        typeReference.reason ??
                        unresolvedWitnessReason ??
                        (protocolBinding !== null || typeReference.binding !== null
                            ? "Conformance references an external Mach-O binding"
                            : "Conditional, generic, resilient or missing static witness table is not decoded"));
                if (staticWitness && witness !== null) {
                    witnessReason = readWitnessConformanceHeader(read, witness, descriptor);
                }
                const conformanceReason = witnessReason ?? typeReference.reason ?? protocolFacts.reason;
                const conformanceDecode = conformanceReason === null
                    ? { status: "decoded", reason: null }
                    : { status: "partial", reason: conformanceReason };
                if (witnessReason === null && conformanceReason !== null)
                    issues.push(issue("swift_conformances_static_witness_slots", "conformance_identity_partial", conformanceReason, hex(descriptor)));
                result.swift_conformances.push({
                    type_name: typeReference.name,
                    type_reference_kind: typeReference.kind,
                    type_reference_target: typeReference.target === null
                        ? { address: null, file_offset: null }
                        : read.targetLocation(typeReference.target),
                    type_binding: typeReference.binding,
                    protocol_name: protocolName,
                    ...(protocol === null
                        ? {}
                        : { protocol_target: read.targetLocation(protocol) }),
                    protocol_binding: protocolBinding,
                    module: typeReference.module,
                    witness_table: witness === null
                        ? { address: null, file_offset: null }
                        : read.targetLocation(witness),
                    location: read.location(descriptor),
                    decode: conformanceDecode,
                    evidence: read.evidence(descriptor, "Swift protocol conformance descriptor, type reference and protocol name"),
                });
                if (conformanceDecode.status === "decoded")
                    decodedRecords++;
                if (witnessReason !== null ||
                    witness === null ||
                    typeReference.name === null ||
                    protocolName === null ||
                    !protocolFacts.readable) {
                    const reason = witnessReason ??
                        typeReference.reason ??
                        "Missing static witness table is not decoded";
                    issues.push(issue("swift_conformances_static_witness_slots", "conformance_decode_partial", reason, hex(descriptor)));
                    continue;
                }
                const count = read.u32(protocol + 16n);
                const signatureCount = read.u32(protocol + 12n);
                if (count > 20_000 || signatureCount > 20_000)
                    throw new RangeError("Swift witness requirement count exceeds 20000");
                for (let slot = 0; slot < count; slot++) {
                    if (!budget.admit())
                        break;
                    const entry = witness + BigInt((slot + 1) * 8);
                    try {
                        const implementationResolution = read.resolvePointer(entry);
                        const implementation = implementationResolution.kind === "raw" ||
                            implementationResolution.kind === "rebase"
                            ? implementationResolution.target
                            : null;
                        const requirementFlags = read.u32(protocol + 24n + BigInt(signatureCount * 12 + slot * 8));
                        const kind = requirementFlags & 15;
                        const synchronousFunction = kind >= 1 && kind <= 4 && (requirementFlags & 0x20) === 0;
                        const executable = implementation !== null &&
                            synchronousFunction &&
                            segments.some((segment) => segment.executable &&
                                implementation >= segment.address &&
                                implementation < segment.address + segment.size);
                        const slotDecode = executable
                            ? { status: "decoded", reason: null }
                            : {
                                status: "partial",
                                reason: implementationResolution.kind === "bind"
                                    ? "Witness implementation is an external Mach-O binding"
                                    : implementationResolution.kind === "unknown" ||
                                        implementationResolution.kind === "unsupported"
                                        ? implementationResolution.reason
                                        : "Witness slot is non-function, async, nil, external, authenticated or encoded; implementation target is unresolved",
                            };
                        result.swift_dispatch_slots.push({
                            owner: `${typeReference.name}: ${protocolName}`,
                            table_kind: "witness_table",
                            slot_index: slot + 1,
                            requirement: null,
                            implementation: null,
                            implementation_address: executable ? hex(implementation) : null,
                            ...(implementationResolution.kind === "bind"
                                ? {
                                    implementation_binding: importBinding(entry, implementationResolution),
                                }
                                : {}),
                            thunk_address: null,
                            location: read.location(entry),
                            decode: slotDecode,
                            evidence: read.evidence(entry, "Static Swift witness slot, indexed after the conformance-descriptor header"),
                        });
                        if (slotDecode.status !== "decoded")
                            issues.push(issue("swift_conformances_static_witness_slots", "witness_slot_unresolved", slotDecode.reason, hex(entry)));
                    }
                    catch (cause) {
                        if (!(cause instanceof RangeError))
                            throw cause;
                        issues.push(issue("swift_conformances_static_witness_slots", "witness_slot_unresolved", cause.message, hex(entry)));
                        break;
                    }
                }
            }
            catch (cause) {
                const message = cause instanceof Error ? cause.message : String(cause);
                issues.push(issue("swift_conformances_static_witness_slots", "conformance_decode_failed", message, hex(field)));
            }
        }
    }
    return {
        facet: "swift_conformances_static_witness_slots",
        examined: swiftExamined,
        decoded: decodedRecords,
        exhaustive: !budget.truncated && issues.length === 0,
        issues,
    };
};

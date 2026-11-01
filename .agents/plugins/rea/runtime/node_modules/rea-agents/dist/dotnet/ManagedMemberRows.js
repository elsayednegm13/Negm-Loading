import { readMethodDefinitionRow } from "./ManagedMethodDefinitionRows.js";
import { jsonStringByteLength } from "../domain/jsonStringByteLength.js";
import { isManagedMemberReferenceInstruction } from "../domain/managed/managedMemberInstructionFacts.js";
import { admitManagedProjection, managedDecodeBudget, } from "./ManagedDecodeBudget.js";
import { metadataSignature, memberTargetIdentity, signatureGenericArity, } from "./ManagedMemberInspectorCore.js";
import { metadataToken, metadataRowCursor, decodeMetadataCodedIndex, readMetadataBlob, readMetadataString, } from "./ManagedMetadataHeaps.js";
import { appendManagedParseIssues, readManagedValue, } from "./ManagedReaderFailure.js";
import { methodBody } from "./ManagedMethodBodyReader.js";
import { memberDeclaringTypeRowLookup } from "./ManagedMemberOwnership.js";
const isSelected = (selected, declared) => selected === null || (declared !== undefined && selected.has(declared.token));
export const parseFields = (bytes, layout, ranges, memberLists, { signatureTypeName, declarationTypeName, selected = null, }) => {
    const fields = [];
    const core = new Map();
    const issues = [];
    const table = layout.table(4);
    const ownerRow = readManagedValue(() => memberDeclaringTypeRowLookup(bytes, layout, 4, memberLists), issues);
    for (let row = 1; row <= (table?.rowCount ?? 0); row += 1) {
        readManagedValue(() => {
            const cursor = metadataRowCursor(bytes, layout, 4, row);
            const flags = cursor.readUInt16();
            const name = readMetadataString(bytes, layout, cursor.readIndex(layout.stringIndexSize), layout.strings.size);
            const owner = ownerRow === undefined
                ? 0
                : (readManagedValue(() => ownerRow(row), issues) ?? 0);
            const declared = ranges[owner - 1];
            const token = metadataToken(4, row);
            core.set(token, {
                token,
                name,
                declaringType: declared?.fullName ?? null,
                kind: "field",
            });
            if (!isSelected(selected, declared))
                return;
            const sig = readMetadataBlob(bytes, layout, cursor.readIndex(layout.blobIndexSize), layout.blob?.size ?? 0);
            const decoded = budgetedSignature(sig, layout, signatureTypeName, issues, { scope: `Field:${token}.signature`, kind: "field" });
            core.set(token, {
                token,
                name,
                declaringType: declared?.fullName ?? null,
                kind: "field",
                identitySha256: memberTargetIdentity(name, declared === undefined ? null : { table: 2, row: owner }, decoded, declarationTypeName),
            });
            fields.push({
                token,
                row_offset: cursor.start,
                declaring_type_token: declared?.token ?? null,
                declaring_type: declared?.fullName ?? null,
                name,
                flags,
                signature: decoded,
            });
        }, issues);
    }
    return { fields, core, issues };
};
const TYPE_FORWARDER_FLAG = 0x0020_0000;
/** Read ExportedType rows, including type forwarders, as declared. */
export const parseExportedTypes = (bytes, layout) => {
    const exportedTypes = [];
    const issues = [];
    const table = layout.table(39);
    for (let row = 1; row <= (table?.rowCount ?? 0); row += 1) {
        readManagedValue(() => {
            const cursor = metadataRowCursor(bytes, layout, 39, row);
            const flags = cursor.readUInt32();
            const typeDefId = cursor.readUInt32();
            const name = readMetadataString(bytes, layout, cursor.readIndex(layout.stringIndexSize), layout.strings.size);
            const namespace = readMetadataString(bytes, layout, cursor.readIndex(layout.stringIndexSize), layout.strings.size);
            const implementationOffset = cursor.offset;
            const implementationRaw = cursor.readIndex(layout.codedIndexSize("Implementation"));
            const token = metadataToken(39, row);
            const implementation = decodeMetadataCodedIndex(implementationRaw, 2, [38, 35, 39], layout.rowCounts);
            if (implementation.kind !== "valid")
                issues.push({
                    code: "invalid-row",
                    scope: `metadata.ExportedType:${token}`,
                    offset: implementationOffset,
                    detail: implementation.kind === "null"
                        ? "ExportedType implementation coded index 0x0 is null, but the Implementation column must reference a row"
                        : `ExportedType implementation coded index 0x${implementationRaw.toString(16)} is invalid: ${implementation.reason}`,
                });
            exportedTypes.push({
                token,
                row_offset: cursor.start,
                namespace,
                name,
                flags,
                forwarder: (flags & TYPE_FORWARDER_FLAG) !== 0,
                type_def_id: typeDefId,
                implementation_token: implementation.kind === "valid" ? implementation.token : null,
            });
        }, issues);
    }
    return { exportedTypes, issues };
};
export const parseMemberRefs = (bytes, layout, { typeName, signatureTypeName, declarationTypeName, }) => {
    const refs = [];
    const core = new Map();
    const issues = [];
    const table = layout.table(10);
    for (let row = 1; row <= (table?.rowCount ?? 0); row += 1) {
        readManagedValue(() => {
            const cursor = metadataRowCursor(bytes, layout, 10, row);
            const parentRaw = cursor.readIndex(layout.codedIndexSize("MemberRefParent"));
            const name = readMetadataString(bytes, layout, cursor.readIndex(layout.stringIndexSize), layout.strings.size);
            const sig = readMetadataBlob(bytes, layout, cursor.readIndex(layout.blobIndexSize), layout.blob?.size ?? 0);
            const token = metadataToken(10, row);
            const parent = decodeMetadataCodedIndex(parentRaw, 3, [2, 1, 26, 6, 27], layout.rowCounts);
            if (parent.kind !== "valid")
                issues.push({
                    code: "invalid-row",
                    scope: `metadata.MemberRef:${token}`,
                    offset: cursor.start,
                    detail: parent.kind === "null"
                        ? "MemberRef parent coded index 0x0 is null, but the Class column must reference a row"
                        : `MemberRef parent coded index 0x${parentRaw.toString(16)} is invalid: ${parent.reason}`,
                });
            const parentToken = parent.kind === "valid" ? parent.token : null;
            const parentName = typeName(parent.kind === "valid" ? parent : null);
            const decoded = budgetedSignature(sig, layout, signatureTypeName, issues, { scope: `MemberRef:${token}.signature` });
            refs.push({
                token,
                row_offset: cursor.start,
                parent_token: parentToken,
                parent_name: parentName,
                name,
                signature: decoded,
            });
            core.set(token, {
                token,
                name,
                declaringType: parentName,
                kind: decoded.kind,
                genericArity: signatureGenericArity(decoded),
                identitySha256: memberTargetIdentity(name, parent.kind === "valid" ? parent : null, decoded, declarationTypeName),
            });
        }, issues);
    }
    return { refs, core, issues };
};
export const parseMethods = ({ bytes, layout, pe, ranges, signatureTypeName, declarationTypeName, memberRefKinds, memberLists, selected = null, methodOffset = 0, methodLimit = Number.MAX_SAFE_INTEGER, }) => {
    const methods = [];
    const core = new Map();
    const issues = [];
    let unscannedMethods = 0;
    const table = layout.table(6);
    const ownerRow = readManagedValue(() => memberDeclaringTypeRowLookup(bytes, layout, 6, memberLists), issues);
    for (let row = 1; row <= (table?.rowCount ?? 0); row += 1) {
        // The owner is read first: a row that produced no method hides a selected
        // body only when its owner is selected, unknown, or unreadably named.
        const owner = ownerRow === undefined
            ? undefined
            : readManagedValue(() => ownerRow(row), issues);
        const declared = owner === undefined ? undefined : ranges[owner - 1];
        const inPage = row > methodOffset && row - methodOffset <= methodLimit;
        const mayBeSelected = inPage &&
            (selected === null ||
                owner === undefined ||
                owner === 0 ||
                isSelected(selected, declared) ||
                // A type whose name is unreadable may be one the caller requested.
                declared?.fullName === null);
        const produced = methods.length;
        readManagedValue(() => {
            const { token, rowOffset, rva, implFlags, flags, nameIndex, signatureIndex, } = readMethodDefinitionRow(bytes, layout, row);
            const name = readMetadataString(bytes, layout, nameIndex, layout.strings.size);
            const member = {
                token,
                name,
                declaringType: declared?.fullName ?? null,
                kind: "method",
            };
            core.set(token, member);
            if (!inPage)
                return;
            if (!isSelected(selected, declared))
                return;
            const sig = readMetadataBlob(bytes, layout, signatureIndex, layout.blob?.size ?? 0);
            const decoded = budgetedSignature(sig, layout, signatureTypeName, issues, { scope: `MethodDef:${token}.signature`, kind: "method" });
            core.set(token, {
                ...member,
                genericArity: signatureGenericArity(decoded),
                identitySha256: memberTargetIdentity(name, declared === undefined || owner === undefined
                    ? null
                    : { table: 2, row: owner }, decoded, declarationTypeName),
            });
            const read = methodBody(bytes, pe, rva, {
                implementation: { implFlags, flags },
                budget: managedDecodeBudget(layout),
                metadataLayout: layout,
                methodToken: token,
                memberRefKinds,
            });
            appendManagedParseIssues(issues, read.issues);
            if (!read.scanned)
                unscannedMethods += 1;
            managedDecodeBudget(layout).reserve(128, rowOffset);
            methods.push({
                tokenInstructions: read.tokenInstructions,
                catchTokens: read.catchTokens,
                method: {
                    token,
                    row_offset: rowOffset,
                    declaring_type_token: declared?.token ?? null,
                    declaring_type: declared?.fullName ?? null,
                    name,
                    rva,
                    impl_flags: implFlags,
                    flags,
                    signature: decoded,
                    body: read.body,
                },
            });
        }, issues);
        if (mayBeSelected && methods.length === produced)
            unscannedMethods += 1;
    }
    return { methods, core, issues, unscannedMethods };
};
/**
 * Member kinds each operand kind may name. A MemberRef whose signature does
 * not decode keeps its name on calls, as before, but is never named a field.
 */
const NAMEABLE_KINDS = new Map([
    ["method", new Set(["method", "unknown"])],
    ["field", new Set(["field"])],
]);
const targetKind = (table) => table === 6
    ? "method-def"
    : table === 0x0a
        ? "member-ref"
        : table === 0x2b
            ? "method-spec"
            : "unknown";
/** The member an operand names, if the operand kind can name that member's kind. */
const namedTarget = (members, operandKind, operand) => {
    const member = members.get(operand);
    return member !== undefined &&
        NAMEABLE_KINDS.get(operandKind)?.has(member.kind) === true
        ? member
        : undefined;
};
export const edges = (methods, members, budget) => {
    const callEdges = [];
    const fieldAccesses = [];
    for (const { method, tokenInstructions } of methods) {
        const derives = tokenInstructions.some((instruction) => isManagedMemberReferenceInstruction({
            opcode: instruction.opcode,
            operand_kind: instruction.operandKind,
            operand: instruction.operand,
        }));
        if (derives)
            budget.admitTransient(callerNameBytes(method), null);
        // Built once per method, only after its exact size was admitted.
        const caller = derives ? callerName(method) : method.name;
        for (const instruction of tokenInstructions) {
            const anchor = {
                opcode: instruction.opcode,
                operand_kind: instruction.operandKind,
                operand: instruction.operand,
            };
            if (!isManagedMemberReferenceInstruction(anchor))
                continue;
            const { operand } = anchor;
            const target = namedTarget(members, anchor.operand_kind, operand);
            if (anchor.operand_kind === "method") {
                // Each derived record is admitted before the graph grows further.
                callEdges.push(admitManagedProjection({
                    caller_token: method.token,
                    il_offset: instruction.offset,
                    target_identity_sha256: target?.identitySha256 ?? null,
                    caller,
                    opcode: anchor.opcode,
                    target_token: operand,
                    target_kind: targetKind(instruction.reference.table),
                    target_name: target?.name ?? null,
                    target_declaring_type: target?.declaringType ?? null,
                }, budget));
            }
            if (anchor.operand_kind === "field") {
                fieldAccesses.push(admitManagedProjection({
                    method_token: method.token,
                    il_offset: instruction.offset,
                    target_identity_sha256: target?.identitySha256 ?? null,
                    method: caller,
                    opcode: anchor.opcode,
                    field_token: operand,
                    field_name: target?.name ?? null,
                    field_declaring_type: target?.declaringType ?? null,
                }, budget));
            }
        }
        // Every record now reserves the name it carries.
        if (derives)
            budget.releaseTransient();
    }
    return { callEdges, fieldAccesses };
};
const callerName = (method) => method.declaring_type === null
    ? method.name
    : `${method.declaring_type}.${method.name}`;
/** JSON bytes of `callerName`, from its parts: the joining dot adds one byte. */
const callerNameBytes = (method) => method.declaring_type === null
    ? jsonStringByteLength(method.name)
    : jsonStringByteLength(method.declaring_type) +
        jsonStringByteLength(method.name) -
        1;
const budgetedSignature = (bytes, layout, signatureTypeName, issues, owner) => {
    const budget = managedDecodeBudget(layout);
    budget.admitTransient(bytes.length * 256, layout.blob?.offset ?? layout.rootOffset);
    try {
        return admitManagedProjection(metadataSignature(bytes, {
            rawSha256: budget.digest(bytes, "sha256"),
            typeName: signatureTypeName,
            layout,
            issues,
            scope: owner.scope,
            ...(owner.kind === undefined ? {} : { expectedKind: owner.kind }),
        }), budget);
    }
    finally {
        budget.releaseTransient();
    }
};

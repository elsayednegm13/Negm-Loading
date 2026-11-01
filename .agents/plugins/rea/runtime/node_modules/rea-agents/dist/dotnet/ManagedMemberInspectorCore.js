import { createHash } from "node:crypto";
import { appendManagedParseIssues, managedFailure, ManagedReaderFailure, readManagedValue, } from "./ManagedReaderFailure.js";
import { managedDecodeBudget, } from "./ManagedDecodeBudget.js";
import { readManagedTypeNesting, } from "./ManagedTypeNesting.js";
import { metadataRowCursor, readManagedCompressedUnsigned, decodeMetadataCodedIndex, metadataCodedIndexCoordinate, metadataToken, readMetadataString, sha256Bytes, } from "./ManagedMetadataHeaps.js";
import { memberListTable } from "./ManagedMemberPointers.js";
export const memberTargetIdentity = (name, declaringType, signature, typeName) => {
    if (declaringType === null ||
        signature.resolved_sha256 === null ||
        signature.parse_status !== "decoded")
        return null;
    const { table, row } = declaringType;
    if (table !== 1 && table !== 2)
        return null;
    const owner = typeName(table, row);
    return owner === null
        ? null
        : createHash("sha256")
            .update("managed-member-nominal-v1\0")
            .update(owner)
            .update(Buffer.from(signature.resolved_sha256, "hex"))
            .update(name)
            .digest("hex");
};
export const isParsedTokenInstruction = (instruction) => instruction.reference !== null;
const rowRange = (table, start, end) => {
    const total = table?.rowCount ?? 0;
    if (start === null || end === null)
        return { first: null, last: null, count: 0 };
    const lastExclusive = Math.min(end, total + 1);
    if (start >= lastExclusive)
        return { first: null, last: null, count: 0 };
    return {
        first: start,
        last: lastExclusive - 1,
        count: lastExclusive - start,
    };
};
export const fullName = (namespace, name) => namespace.length === 0 ? name : `${namespace}.${name}`;
const readTypeDefinition = (bytes, layout, row, issues, memberLists) => {
    const cursor = metadataRowCursor(bytes, layout, 2, row);
    cursor.readUInt32();
    const nameIndex = cursor.readIndex(layout.stringIndexSize);
    const namespaceIndex = cursor.readIndex(layout.stringIndexSize);
    // Keep both independent name failures, but decode each heap coordinate once.
    const namespace = readManagedValue(() => readMetadataString(bytes, layout, namespaceIndex, layout.strings.size), issues);
    const name = readManagedValue(() => readMetadataString(bytes, layout, nameIndex, layout.strings.size), issues);
    cursor.readIndex(layout.codedIndexSize("TypeDefOrRef"));
    const current = memberLists.entries[row - 1];
    return {
        row,
        name,
        namespace,
        token: metadataToken(2, row),
        fullName: namespace === undefined || name === undefined
            ? null
            : fullName(namespace, name),
        fieldStart: current?.field.start.value ?? null,
        fieldEnd: current?.field.end ?? null,
        methodStart: current?.method.start.value ?? null,
        methodEnd: current?.method.end ?? null,
    };
};
export const readTypeDefinitions = (bytes, layout, issues, memberLists) => {
    appendManagedParseIssues(issues, memberLists.issues);
    const typeTable = layout.table(2);
    const definitions = [];
    for (let row = 1; row <= (typeTable?.rowCount ?? 0); row += 1)
        definitions.push(readTypeDefinition(bytes, layout, row, issues, memberLists));
    return definitions;
};
/**
 * Enclosing TypeDef row of each nested TypeDef row, from the NestedClass
 * table. Nesting is complete only when every row was read and valid.
 */
export const parseTypes = (bytes, layout, definitions) => {
    const fields = memberListTable(layout, 4);
    const methods = memberListTable(layout, 6);
    const items = [];
    const issues = [];
    const nesting = readManagedTypeNesting(bytes, layout, issues);
    for (const definition of definitions) {
        const { row, name, namespace, token } = definition;
        if (name === undefined ||
            namespace === undefined ||
            definition.fullName === null)
            continue;
        const cursor = metadataRowCursor(bytes, layout, 2, row);
        const flags = cursor.readUInt32();
        cursor.readIndex(layout.stringIndexSize);
        cursor.readIndex(layout.stringIndexSize);
        const extendsOffset = cursor.offset;
        const extendsRaw = cursor.readIndex(layout.codedIndexSize("TypeDefOrRef"));
        const fieldRange = rowRange(fields, definition.fieldStart, definition.fieldEnd);
        const methodRange = rowRange(methods, definition.methodStart, definition.methodEnd);
        const extendsIndex = decodeMetadataCodedIndex(extendsRaw, 2, [2, 1, 27], layout.rowCounts);
        if (extendsIndex.kind === "invalid")
            issues.push({
                code: "invalid-row",
                scope: `metadata.TypeDef:${token}`,
                offset: extendsOffset,
                detail: `TypeDef Extends coded index 0x${extendsRaw.toString(16)} is invalid: ${extendsIndex.reason}`,
            });
        const enclosingRow = nesting.enclosing.get(row);
        managedDecodeBudget(layout).reserve(128, cursor.start);
        items.push({
            row,
            type: {
                token,
                row_offset: cursor.start,
                namespace,
                name,
                full_name: definition.fullName,
                flags,
                extends_token: extendsIndex.kind === "valid" ? extendsIndex.token : null,
                enclosing_type_token: enclosingRow === undefined ? null : metadataToken(2, enclosingRow),
                name_sha256: null,
                field_list: {
                    first_row: fieldRange.first,
                    last_row: fieldRange.last,
                    count: fieldRange.count,
                },
                method_list: {
                    first_row: methodRange.first,
                    last_row: methodRange.last,
                    count: methodRange.count,
                },
            },
        });
    }
    return { types: items, issues, nesting };
};
export const readCompressed = (bytes, offset) => {
    const decoded = readManagedCompressedUnsigned(bytes, offset);
    if (!decoded.ok)
        throw managedFailure("invalid-blob", "signature", decoded.error.kind === "truncated"
            ? "truncated compressed integer"
            : "reserved compressed integer", offset);
    return { value: decoded.value.value, next: offset + decoded.value.width };
};
const ELEMENT_TYPES = new Map([
    [0x01, "void"],
    [0x02, "bool"],
    [0x03, "char"],
    [0x04, "i1"],
    [0x05, "u1"],
    [0x06, "i2"],
    [0x07, "u2"],
    [0x08, "i4"],
    [0x09, "u4"],
    [0x0a, "i8"],
    [0x0b, "u8"],
    [0x0c, "r4"],
    [0x0d, "r8"],
    [0x0e, "string"],
    [0x18, "native-int"],
    [0x19, "native-uint"],
    [0x1c, "object"],
]);
const readSignedCompressed = (bytes, offset) => {
    const encoded = readCompressed(bytes, offset);
    const width = encoded.next - offset === 1 ? 7 : encoded.next - offset === 2 ? 14 : 29;
    const magnitude = Math.floor(encoded.value / 2);
    return {
        value: encoded.value % 2 === 0 ? magnitude : magnitude - 2 ** (width - 1),
        next: encoded.next,
    };
};
const malformedSignature = (detail, offset) => {
    throw managedFailure("invalid-blob", "signature", detail, offset);
};
// MethodDefSig and MethodRefSig headers (ECMA-335 II.23.2.1-2) without
// HASTHIS and EXPLICITTHIS: DEFAULT, VARARG, or GENERIC, which implies DEFAULT.
const MEMBER_METHOD_HEADERS = new Set([0x00, 0x05, 0x10]);
// FNPTR also carries the unmanaged C, STDCALL, THISCALL, FASTCALL, and
// UNMANAGED conventions that compilers emit for unmanaged function pointers.
const FUNCTION_POINTER_CONVENTIONS = new Set([0, 1, 2, 3, 4, 5, 9]);
/**
 * Read a method signature's calling convention and counts. A header that is
 * not a method signature in its context (a MethodDef or MemberRef row, or an
 * FNPTR type), sets the reserved bit, or sets EXPLICITTHIS without HASTHIS is
 * malformed, so no caller consumes its counts. FIELD, LOCAL_SIG, PROPERTY,
 * and GENERICINST headers are never method signatures.
 */
const readMethodSignatureHeader = (blob, offset, context) => {
    const first = blob[offset];
    if (first === undefined)
        return malformedSignature("truncated method signature", offset);
    const allowed = context === "member"
        ? MEMBER_METHOD_HEADERS.has(first & 0x9f)
        : (first & 0x80) === 0 && FUNCTION_POINTER_CONVENTIONS.has(first & 0x0f);
    if (!allowed || ((first & 0x40) !== 0 && (first & 0x20) === 0))
        return malformedSignature(`calling convention 0x${first.toString(16)} does not head a ${context} method signature`, offset);
    let next = offset + 1;
    let genericParameterCount = null;
    if ((first & 0x10) !== 0) {
        const generic = readCompressed(blob, next);
        genericParameterCount = generic.value;
        next = generic.next;
    }
    const parameterCount = readCompressed(blob, next);
    return {
        first,
        genericParameterCount,
        parameterCount: parameterCount.value,
        next: parameterCount.next,
    };
};
const MAX_ARRAY_RANK = 32;
const arrayShape = (blob, offset) => {
    const rank = readCompressed(blob, offset);
    if (rank.value === 0)
        return malformedSignature("array rank is zero", offset);
    // ECMA-335 leaves rank unbounded, but the CLR loads at most 32 dimensions;
    // larger ranks would expand a few bytes into an unbounded rendering.
    if (rank.value > MAX_ARRAY_RANK)
        throw managedFailure("unsupported-signature", "signature", `array rank ${String(rank.value)} exceeds the ${String(MAX_ARRAY_RANK)} dimensions the CLR supports`, offset);
    const sizeCount = readCompressed(blob, rank.next);
    if (sizeCount.value > rank.value)
        return malformedSignature("array has more sizes than dimensions", offset);
    const sizes = [];
    let next = sizeCount.next;
    for (let index = 0; index < sizeCount.value; index += 1) {
        const size = readCompressed(blob, next);
        sizes.push(size.value);
        next = size.next;
    }
    const boundCount = readCompressed(blob, next);
    if (boundCount.value > rank.value)
        return malformedSignature("array has more lower bounds than dimensions", offset);
    const lowerBounds = [];
    next = boundCount.next;
    for (let index = 0; index < boundCount.value; index += 1) {
        const bound = readSignedCompressed(blob, next);
        lowerBounds.push(bound.value);
        next = bound.next;
    }
    const dimensions = Array.from({ length: rank.value }, (_, index) => {
        const size = sizes[index];
        const lower = lowerBounds[index];
        if (lower !== undefined)
            return size === undefined
                ? `${String(lower)}...`
                : `${String(lower)}...${String(lower + size - 1)}`;
        if (size !== undefined)
            return String(size);
        // ILAsm spelling: a bare rank-1 `[]` is reserved for SZARRAY.
        return rank.value === 1 ? "..." : "";
    });
    return { value: `[${dimensions.join(",")}]`, next };
};
// Custom modifiers do not change the position they precede.
const currentPosition = (stack, base) => {
    const frame = stack.findLast(({ kind }) => kind !== "modifiers");
    if (frame === undefined)
        return base;
    if (frame.kind === "suffix")
        return frame.suffix === "*" ? "pointee" : "type";
    if (frame.kind === "list" && frame.signatureItems)
        return frame.items.length === 0 ? "return" : "parameter";
    return "type";
};
// VOID is a RetType or a pointee; TYPEDBYREF is a RetType, Param, or local;
// BYREF prefixes a RetType, Param, local, or (since ref fields) a field type.
const POSITION_ELEMENTS = new Map([
    [0x01, ["return", "pointee"]],
    [0x16, ["return", "parameter", "local"]],
    [0x10, ["return", "parameter", "local", "field"]],
]);
/** Decode a type operand once; spec callers also validate its metadata coordinate. */
const readTypeOperand = (blob, offset, layout, tables = [2, 1, 27]) => {
    const token = readCompressed(blob, offset);
    if (layout !== undefined) {
        const decoded = decodeMetadataCodedIndex(token.value, 2, tables, layout.rowCounts);
        if (decoded.kind !== "valid")
            throw managedFailure("invalid-row", "signature", `TypeDefOrRefOrSpec operand 0x${token.value.toString(16)} is invalid: ${decoded.kind === "null" ? "type operand is null" : decoded.reason}`, offset);
        return { ...token, coordinate: { table: decoded.table, row: decoded.row } };
    }
    const { table, row } = metadataCodedIndexCoordinate(token.value, 2, tables);
    return { ...token, coordinate: { table, row } };
};
const readTypeSignature = (blob, offset, base, { layout, operands, } = {}) => {
    const stack = [];
    let cursor = offset;
    let nominalGenericType = null;
    let pinned = false;
    for (;;) {
        let value;
        const kind = blob[cursor];
        if (kind === undefined)
            return malformedSignature("truncated type signature", cursor);
        if (kind === 0x41) {
            const signature = stack.at(-1);
            if (signature?.kind !== "list" || !signature.signatureItems)
                throw managedFailure("unsupported-signature", "signature", "unsupported element type 0x41", cursor);
            if (!signature.vararg)
                throw managedFailure("unsupported-signature", "signature", "unsupported element type 0x41", cursor);
            if (signature.sentinelSeen || signature.remaining === 0)
                return malformedSignature("VARARG function pointer has an invalid sentinel position", cursor);
            signature.sentinelSeen = true;
            cursor += 1;
            if (blob[cursor] === undefined || blob[cursor] === 0x41)
                return malformedSignature("VARARG function pointer has adjacent sentinels", cursor);
            continue;
        }
        const positions = POSITION_ELEMENTS.get(kind);
        if (positions !== undefined &&
            !positions.includes(currentPosition(stack, base)))
            return malformedSignature(`element type 0x${kind.toString(16)} is not valid in a ${currentPosition(stack, base)} position`, cursor);
        if (kind === 0x45) {
            if (base !== "local")
                throw managedFailure("unsupported-signature", "signature", "unsupported element type 0x45", cursor);
            if (pinned ||
                stack.some(({ kind: frameKind }) => frameKind !== "modifiers"))
                return malformedSignature("PINNED is not valid in this type position", cursor);
            pinned = true;
            cursor += 1;
            continue;
        }
        const named = ELEMENT_TYPES.get(kind);
        if (named !== undefined) {
            value = named;
            cursor += 1;
        }
        else if (kind === 0x0f || kind === 0x10 || kind === 0x1d) {
            const suffix = kind === 0x0f ? "*" : kind === 0x10 ? "&" : "[]";
            stack.push({ kind: "suffix", suffix });
            cursor += 1;
        }
        else if (kind === 0x1f || kind === 0x20) {
            if (pinned && currentPosition(stack, base) === "local")
                return malformedSignature("custom modifier follows the LocalVarSig PINNED constraint", cursor);
            const token = readTypeOperand(blob, cursor + 1, layout);
            operands?.push({ offset: cursor + 1, ...token });
            const modifier = `${kind === 0x1f ? "modreq" : "modopt"}:${String(token.value)}`;
            // A modifier frame on top was pushed by the directly preceding byte;
            // keep an adjacent run together and in source order.
            const top = stack.at(-1);
            if (top?.kind === "modifiers")
                top.modifiers.push(modifier);
            else
                stack.push({ kind: "modifiers", modifiers: [modifier] });
            cursor = token.next;
        }
        else if (kind === 0x11 || kind === 0x12) {
            const token = readTypeOperand(blob, cursor + 1, layout);
            operands?.push({ offset: cursor + 1, ...token });
            value = `${kind === 0x11 ? "valuetype" : "class"}:${String(token.value)}`;
            cursor = token.next;
        }
        else if (kind === 0x1e || kind === 0x13) {
            const variable = readCompressed(blob, cursor + 1);
            value = `${kind === 0x1e ? "mvar" : "var"}:${String(variable.value)}`;
            cursor = variable.next;
        }
        else if (kind === 0x16) {
            if (pinned && currentPosition(stack, base) === "local")
                return malformedSignature("TYPEDBYREF cannot have a LocalVarSig PINNED constraint", cursor);
            value = "typedbyref";
            cursor += 1;
        }
        else if (kind === 0x14) {
            stack.push({ kind: "array" });
            cursor += 1;
        }
        else if (kind === 0x15) {
            const generic = blob[cursor + 1];
            if (generic !== 0x11 && generic !== 0x12)
                return malformedSignature("generic instantiation does not name a class or value type", cursor + 1);
            const token = readTypeOperand(blob, cursor + 2, layout, [2, 1]);
            if (cursor === offset &&
                (token.coordinate.table === 1 || token.coordinate.table === 2))
                nominalGenericType = {
                    table: token.coordinate.table,
                    row: token.coordinate.row,
                };
            operands?.push({ offset: cursor + 2, ...token });
            const argumentCount = readCompressed(blob, token.next);
            if (argumentCount.value === 0)
                return malformedSignature("generic instantiation has no type arguments", token.next);
            const head = `${generic === 0x11 ? "valuetype" : "class"}:${String(token.value)}`;
            stack.push({
                kind: "list",
                remaining: argumentCount.value,
                items: [],
                signatureItems: false,
                render: (items) => `${head}<${items.join(",")}>`,
            });
            cursor = argumentCount.next;
        }
        else if (kind === 0x1b) {
            const header = readMethodSignatureHeader(blob, cursor + 1, "function-pointer");
            const convention = callingConvention(header.first);
            const head = header.genericParameterCount === null
                ? convention
                : `${convention};${String(header.genericParameterCount)}`;
            stack.push({
                kind: "list",
                remaining: header.parameterCount + 1,
                items: [],
                signatureItems: true,
                vararg: (header.first & 0x0f) === 5,
                sentinelSeen: false,
                render: ([returnType, ...parameters]) => `fnptr[${head}](${parameters.join(",")})->${returnType ?? ""}`,
            });
            cursor = header.next;
        }
        else {
            throw managedFailure("unsupported-signature", "signature", `unsupported element type 0x${kind.toString(16)}`, cursor);
        }
        while (value !== undefined) {
            const top = stack.pop();
            if (top === undefined)
                return { value, next: cursor, nominalGenericType };
            if (top.kind === "suffix")
                value += top.suffix;
            else if (top.kind === "modifiers")
                value = `${value} ${top.modifiers.join(" ")}`;
            else if (top.kind === "array") {
                const shape = arrayShape(blob, cursor);
                value += shape.value;
                cursor = shape.next;
            }
            else {
                top.items.push(value);
                top.remaining -= 1;
                if (top.remaining === 0)
                    value = top.render(top.items);
                else {
                    value = undefined;
                    stack.push(top);
                }
            }
        }
    }
};
/** Validate a StandAloneSig LocalVarSig without projecting local type identities. */
export const validateLocalSignature = (layout, blob, { scope, blobOffset, }, budget) => {
    budget.admitTransient(blob.length * 256, blobOffset);
    try {
        if (blob[0] !== 0x07)
            malformedSignature("StandAloneSig row does not contain a LocalVarSig", 0);
        const count = readCompressed(blob, 1);
        if (count.value === 0 || count.value > 0xfffe)
            malformedSignature(`LocalVarSig local count ${String(count.value)} is outside the ECMA-335 range`, 1);
        let cursor = count.next;
        for (let index = 0; index < count.value; index += 1) {
            const local = readTypeSignature(blob, cursor, "local", { layout });
            cursor = local.next;
        }
        if (cursor !== blob.length)
            malformedSignature("Trailing LocalVarSig data", cursor);
        return null;
    }
    catch (cause) {
        if (!(cause instanceof ManagedReaderFailure) ||
            (cause.issue.code !== "invalid-blob" &&
                cause.issue.code !== "invalid-row" &&
                cause.issue.code !== "unsupported-signature"))
            throw cause;
        return {
            ...cause.issue,
            scope,
            offset: cause.issue.offset === null
                ? blobOffset
                : blobOffset + cause.issue.offset,
        };
    }
};
const CALLING_CONVENTION_NAMES = new Map([
    [0, "default"],
    [1, "c"],
    [2, "stdcall"],
    [3, "thiscall"],
    [4, "fastcall"],
    [5, "vararg"],
    [6, "field"],
    [9, "unmanaged"],
]);
const callingConvention = (value) => {
    const base = value & 0x0f;
    const flags = [
        (value & 0x20) === 0 ? null : "has-this",
        (value & 0x40) === 0 ? null : "explicit-this",
        (value & 0x10) === 0 ? null : "generic",
    ].filter((flag) => flag !== null);
    const name = CALLING_CONVENTION_NAMES.get(base) ?? `unknown:${String(base)}`;
    return flags.length === 0 ? name : `${name} ${flags.join(" ")}`;
};
/**
 * Decode a whole TypeSpec blob, or a MethodSpec instantiation (GENERICINST,
 * argument count, Types), with the member-signature grammar and return the
 * rendered types. A malformed or unsupported blob throws invalid-blob or
 * unsupported-signature under the owning row, so coverage records it.
 */
export const specSignatureFacts = (layout, blob, owner, typeName) => {
    const budget = managedDecodeBudget(layout);
    // Rendering is transient, so charge it as member signatures are charged.
    budget.admitTransient(blob.length * 256, owner.offset);
    try {
        let cursor = 0;
        let count = 1;
        if (owner.form === "instantiation") {
            if (blob[0] !== 0x0a)
                malformedSignature("MethodSpec instantiation is not GENERICINST", 0);
            const header = readCompressed(blob, 1);
            if (header.value === 0)
                malformedSignature("MethodSpec instantiation has no type arguments", 1);
            count = header.value;
            cursor = header.next;
        }
        const types = [];
        const operands = [];
        let nominalGenericType = null;
        // Each Type consumes at least one byte, so a false count fails on truncation.
        for (let index = 0; index < count; index += 1) {
            const type = readTypeSignature(blob, cursor, "type", {
                layout,
                operands,
            });
            types.push(type.value);
            if (owner.form === "type")
                nominalGenericType = type.nominalGenericType;
            cursor = type.next;
        }
        if (cursor !== blob.length)
            malformedSignature("Trailing signature data", cursor);
        return {
            types,
            resolvedSha256: typeName === undefined
                ? null
                : resolvedSha256(blob, operands, typeName),
            nominalGenericType,
        };
    }
    catch (cause) {
        if (!(cause instanceof ManagedReaderFailure) ||
            (cause.issue.code !== "invalid-blob" &&
                cause.issue.code !== "invalid-row" &&
                cause.issue.code !== "unsupported-signature"))
            throw cause;
        throw managedFailure(cause.issue.code, owner.scope, cause.issue.detail, owner.offset);
    }
    finally {
        budget.releaseTransient();
    }
};
/**
 * Decode a field or member method signature. A malformed or unsupported blob
 * decodes as kind `unknown` with its reason.
 */
const decodeSignature = (blob, layout, operands = [], issueSink, scope = "signature") => {
    let kind = "unknown";
    try {
        if (blob.length === 0)
            throw managedFailure("invalid-blob", "signature", "empty signature", 0);
        const first = blob[0] ?? 0;
        // FieldSig (II.23.2.4) is exactly FIELD; a flagged FIELD header is not a
        // method header either, so it is malformed below.
        if (first === 0x06) {
            kind = "field";
            const fieldType = readTypeSignature(blob, 1, "field", {
                operands,
                ...(layout === undefined ? {} : { layout }),
            });
            return {
                kind: "field",
                parse_status: fieldType.next === blob.length ? "decoded" : "partial",
                calling_convention: callingConvention(first),
                generic_parameter_count: null,
                parameter_count: null,
                return_type: null,
                parameter_types: [],
                field_type: fieldType.value,
                issue: fieldType.next === blob.length ? null : "Trailing signature data",
            };
        }
        const header = readMethodSignatureHeader(blob, 0, "member");
        kind = "method";
        const returnType = readTypeSignature(blob, header.next, "return", {
            operands,
            ...(layout === undefined ? {} : { layout }),
        });
        let offset = returnType.next;
        const parameters = [];
        let sentinelSeen = false;
        for (let index = 0; index < header.parameterCount; index += 1) {
            if (blob[offset] === 0x41 && (first & 0x0f) === 5) {
                if (sentinelSeen)
                    malformedSignature("VARARG signature has an invalid sentinel position", offset);
                sentinelSeen = true;
                offset += 1;
                if (blob[offset] === undefined || blob[offset] === 0x41)
                    malformedSignature("VARARG signature has adjacent sentinels", offset);
            }
            const parameter = readTypeSignature(blob, offset, "parameter", {
                operands,
                ...(layout === undefined ? {} : { layout }),
            });
            parameters.push(parameter.value);
            offset = parameter.next;
        }
        return {
            kind: "method",
            parse_status: offset === blob.length ? "decoded" : "partial",
            calling_convention: callingConvention(first),
            generic_parameter_count: header.genericParameterCount,
            parameter_count: header.parameterCount,
            return_type: returnType.value,
            parameter_types: parameters,
            field_type: null,
            issue: offset === blob.length ? null : "Trailing signature data",
        };
    }
    catch (cause) {
        if (!(cause instanceof ManagedReaderFailure))
            throw cause;
        if (cause.issue.code !== "invalid-blob" &&
            cause.issue.code !== "invalid-row" &&
            cause.issue.code !== "unsupported-signature")
            throw cause;
        if (cause.issue.code === "invalid-row")
            issueSink?.({ ...cause.issue, scope });
        return {
            kind: cause.issue.code === "invalid-row" ? kind : "unknown",
            parse_status: cause.issue.code === "unsupported-signature"
                ? "unsupported"
                : "malformed",
            calling_convention: null,
            generic_parameter_count: null,
            parameter_count: null,
            return_type: null,
            parameter_types: [],
            field_type: null,
            issue: cause.issue.detail,
        };
    }
};
/**
 * Generic parameter count of a method signature that decodes completely, 0
 * when it is not generic, or null when the blob is not a decodable method
 * signature. The rendered decode is transient.
 */
export const methodGenericArity = (layout, blob) => {
    const budget = managedDecodeBudget(layout);
    budget.admitTransient(blob.length * 256, layout.blob?.offset ?? layout.rootOffset);
    try {
        return signatureGenericArity(decodeSignature(blob));
    }
    finally {
        budget.releaseTransient();
    }
};
/**
 * Generic parameter count of a completely decoded method signature, 0 when it
 * is not generic, or null for any other signature.
 */
export const signatureGenericArity = (decoded) => decoded.kind === "method" && decoded.parse_status === "decoded"
    ? (decoded.generic_parameter_count ?? 0)
    : null;
/**
 * Each type operand is replaced by 0xff, which never starts a compressed
 * coded index, then the 32-byte name digest; a blob without type operands
 * keeps its raw digest. So no decodable signature's resolved preimage is
 * another's, but an undecodable blob can hold one, and its raw digest then
 * equals that resolved digest. Comparison keys the two kinds apart.
 */
const OPERAND_MARKER = Buffer.from([0xff]);
/**
 * Digest the blob with each type operand replaced by its type's name digest,
 * so the value does not depend on build-local row numbers.
 */
const resolvedSha256 = (blob, operands, typeName) => {
    const hash = createHash("sha256");
    let copied = 0;
    for (const operand of operands) {
        const name = typeName(operand);
        if (name === null)
            return null;
        hash.update(blob.subarray(copied, operand.offset));
        hash.update(OPERAND_MARKER);
        hash.update(name);
        copied = operand.next;
    }
    hash.update(blob.subarray(copied));
    return hash.digest("hex");
};
const projectSignature = (blob, rawSha256, typeName, decoded, operands) => {
    return {
        raw_length: blob.length,
        raw_sha256: rawSha256 ?? sha256Bytes(blob),
        resolved_sha256: decoded.kind === "unknown" || decoded.parse_status === "malformed"
            ? null
            : resolvedSha256(blob, operands, typeName),
        ...decoded,
    };
};
/** Standalone signature decoding used by tests and signature identity utilities. */
export const signature = (blob, rawSha256, typeName = () => null) => {
    const operands = [];
    return projectSignature(blob, rawSha256, typeName, decodeSignature(blob, undefined, operands), operands);
};
/** Decode a metadata-owned signature while validating referenced table rows. */
export const metadataSignature = (blob, { rawSha256, typeName, layout, issues, scope, expectedKind, }) => {
    const operands = [];
    let decoded = decodeSignature(blob, layout, operands, (issue) => issues.push(issue), scope);
    if (expectedKind !== undefined &&
        decoded.kind !== "unknown" &&
        decoded.kind !== expectedKind) {
        const detail = `Expected ${expectedKind} signature; decoded ${decoded.kind}${decoded.issue === null ? "" : `: ${decoded.issue}`}`;
        issues.push({ code: "invalid-blob", scope, offset: null, detail });
        decoded = { ...decoded, parse_status: "malformed", issue: detail };
    }
    return projectSignature(blob, rawSha256, typeName, decoded, operands);
};

import { parseDolHeader } from "./gamecubeDol.js";
import { parseRawBinaryEntryPoint } from "./rawBinary.js";
import { err, ok } from "./result.js";
/** Architecture every admitted DOL establishes; callers cannot select another. */
export const GAMECUBE_DOL_ARCHITECTURE = "powerpc";
/**
 * Validate a caller-selected DOL image. A caller `entry_point` is optional and
 * must equal the header entry; any other value is a selection conflict.
 */
export const admitGamecubeDol = (input) => {
    const parsed = parseDolHeader(input.bytes, input.fileSize ?? input.bytes.length);
    if (!parsed.ok)
        return err({
            reason: `gamecube-dol header rejected: ${parsed.error}`,
            constraint: "file_format_rejected",
        });
    const header = parsed.value;
    const entryPoint = `0x${header.entryPoint.toString(16)}`;
    if (input.entryPoint !== undefined) {
        if (typeof input.entryPoint !== "string")
            return err({
                reason: "gamecube-dol entry_point must be a hexadecimal address of the form 0x…",
                constraint: "load_selection_rejected",
            });
        const requested = parseRawBinaryEntryPoint(input.entryPoint);
        if (!requested.ok)
            return err({
                reason: requested.error,
                constraint: "load_selection_rejected",
            });
        if (requested.value.value !== BigInt(header.entryPoint))
            return err({
                reason: `gamecube-dol entry_point ${requested.value.canonical} conflicts with the DOL header entry ${entryPoint}`,
                constraint: "load_selection_rejected",
            });
    }
    return ok({
        architecture: GAMECUBE_DOL_ARCHITECTURE,
        entryPoint,
        entryPointSource: "dol-header",
        header,
    });
};

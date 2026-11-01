/** Parse JSON text, returning the failure reason instead of throwing. */
export const safeParseJson = (value, reviver) => {
    try {
        return { ok: true, value: JSON.parse(value, reviver) };
    }
    catch (cause) {
        return {
            ok: false,
            error: cause instanceof Error ? cause.message : String(cause),
            cause,
        };
    }
};

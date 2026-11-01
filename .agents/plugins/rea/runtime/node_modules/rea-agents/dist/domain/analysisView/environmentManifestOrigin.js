import { compareUnicodeCodePoints as compare } from "../unicodeCodePointOrder.js";
/** The origin with the most JSON-like records, then most records, then lowest code points: the application a capture records. */
export const primaryOrigin = (origins) => {
    let best = null;
    for (const [origin, stats] of origins) {
        if (best === null ||
            stats.jsonLike > best.jsonLike ||
            (stats.jsonLike === best.jsonLike &&
                (stats.records > best.records ||
                    (stats.records === best.records && compare(origin, best.origin) < 0))))
            best = { origin, ...stats };
    }
    return best?.origin ?? null;
};

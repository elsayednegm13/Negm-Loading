/**
 * Overlap independent reads with an enumeration while consuming their results
 * in enumeration order. `read` returns undefined for items it skips. At most
 * `width` reads are in flight. A failure is reported as a one-at-a-time loop
 * would report it: an earlier item's read or consume failure wins over a
 * later read failure or an enumeration failure. Every started read settles
 * before this returns or throws, and an enumeration left early is closed as
 * `for await` would close it.
 */
export const consumeWithOrderedReads = async (items, width, read, consume) => {
    const pending = [];
    const consumeNext = async () => {
        const next = pending.shift();
        if (next === undefined)
            return;
        const result = await next.result;
        if (!result.ok)
            throw result.error;
        await consume(next.item, result.value);
    };
    const iterator = items[Symbol.asyncIterator]();
    let iterating = true;
    try {
        while (iterating) {
            let step;
            try {
                step = await iterator.next();
            }
            catch (cause) {
                iterating = false;
                while (pending.length > 0)
                    await consumeNext();
                throw cause;
            }
            if (step.done === true) {
                iterating = false;
                break;
            }
            const started = read(step.value);
            if (started === undefined)
                continue;
            pending.push({
                item: step.value,
                result: started.then((value) => ({ ok: true, value }), (error) => ({ ok: false, error })),
            });
            if (pending.length >= width)
                await consumeNext();
        }
        while (pending.length > 0)
            await consumeNext();
    }
    finally {
        if (iterating)
            await iterator.return?.().catch(() => undefined);
        await Promise.all(pending.map(({ result }) => result));
    }
};

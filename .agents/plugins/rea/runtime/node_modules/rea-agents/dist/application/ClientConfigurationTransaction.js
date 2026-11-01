import { resolve } from "node:path";
const activeTransactions = new Map();
/**
 * Serialize the full read/merge/publish operation for one resolved
 * configuration path.
 */
export const withClientConfigurationTransaction = async (path, operation) => {
    const key = resolve(path);
    const previous = activeTransactions.get(key);
    let release;
    const current = new Promise((complete) => {
        release = complete;
    });
    activeTransactions.set(key, current);
    await previous;
    try {
        return await operation();
    }
    finally {
        release();
        if (activeTransactions.get(key) === current)
            activeTransactions.delete(key);
    }
};

import pino, {} from "pino";
/** Create a JSON logger on stderr so protocol and CLI result stdout stay valid. */
export const createLogger = (mode, level) => pino({
    level,
    base: { application: "rea", mode },
}, pino.destination({ dest: 2, sync: false }));
/** Logger used by embedders that have not opted into process output. */
export const silentLogger = pino({ level: "silent" });

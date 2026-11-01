import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import pino from "pino";

//#region dist/logger.js
var createLogger, silentLogger;
function init_logger() {
	return (init_logger = __esmMin((() => {
		createLogger = (mode, level) => pino({
			level,
			base: {
				application: "rea",
				mode
			}
		}, pino.destination({
			dest: 2,
			sync: false
		}));
		silentLogger = pino({ level: "silent" });
	})))();
}

//#endregion
export { createLogger, init_logger, silentLogger };
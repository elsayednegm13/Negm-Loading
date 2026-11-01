import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
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
export { init_logger as n, silentLogger as r, createLogger as t };
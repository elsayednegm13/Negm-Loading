import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { z } from "zod";

//#region dist/domain/native/nativeProcedureInput.js
var nativeProcedureInputSchema;
function init_nativeProcedureInput() {
	return (init_nativeProcedureInput = __esmMin((() => {
		nativeProcedureInputSchema = z.strictObject({ procedure: z.string().describe("A procedure name or address") });
	})))();
}

//#endregion
export { init_nativeProcedureInput, nativeProcedureInputSchema };
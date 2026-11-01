import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { i as init_configurationErrors, n as ConfigurationError } from "./configurationErrors-B8zPbKDE.js";
import { n as init_result, r as ok, t as err } from "./result-Dbqc_peo.js";
import { z } from "zod";

//#region dist/config/mcpHttpEndpoint.js
var DEFAULT_MCP_HTTP_HOST, DEFAULT_MCP_HTTP_PORT, mcpHttpListenerPortSchema, mcpHttpPortSchema, mcpHttpHostSchema, MCP_HTTP_PORT_CONSTRAINT, MCP_HTTP_HOST_CONSTRAINT, parseMcpHttpEndpoint;
function init_mcpHttpEndpoint() {
	return (init_mcpHttpEndpoint = __esmMin((() => {
		init_configurationErrors();
		init_result();
		DEFAULT_MCP_HTTP_HOST = "127.0.0.1";
		DEFAULT_MCP_HTTP_PORT = 0;
		mcpHttpListenerPortSchema = z.number().int().min(0).max(65535);
		mcpHttpPortSchema = z.string().regex(/^(?:0|[1-9]\d*)$/u).transform(Number).pipe(mcpHttpListenerPortSchema);
		mcpHttpHostSchema = z.string().trim().min(1);
		MCP_HTTP_PORT_CONSTRAINT = "MCP_PORT must be a decimal integer between 0 and 65535.";
		MCP_HTTP_HOST_CONSTRAINT = "MCP_HOST must be a non-empty host name or IP address.";
		parseMcpHttpEndpoint = (environment, overrides = {}) => {
			const issues = [];
			let host = overrides.host ?? "127.0.0.1";
			let port = overrides.port ?? 0;
			if (overrides.host === undefined && environment.MCP_HOST !== undefined) {
				const parsed = mcpHttpHostSchema.safeParse(environment.MCP_HOST);
				if (parsed.success) host = parsed.data;
				else issues.push({
					setting: "MCP_HOST",
					constraint: MCP_HTTP_HOST_CONSTRAINT
				});
			}
			if (overrides.port === undefined && environment.MCP_PORT !== undefined) {
				const parsed = mcpHttpPortSchema.safeParse(environment.MCP_PORT);
				if (parsed.success) port = parsed.data;
				else issues.push({
					setting: "MCP_PORT",
					constraint: MCP_HTTP_PORT_CONSTRAINT
				});
			}
			if (issues.length > 0) return err(new ConfigurationError(issues.map(({ constraint }) => constraint).join(" "), { settings: issues }));
			return ok({
				host,
				port
			});
		};
	})))();
}

//#endregion
export { parseMcpHttpEndpoint as a, mcpHttpPortSchema as i, init_mcpHttpEndpoint as n, mcpHttpListenerPortSchema as r, MCP_HTTP_PORT_CONSTRAINT as t };
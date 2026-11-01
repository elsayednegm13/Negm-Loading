import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { init_mcpStartupBudgets, mcpPhaseBudgetRecovery } from "./javascriptFeatureTraceSchemas-machBq68.js";

//#region dist/mcpStartupPolicy.js
var MCP_STARTUP_POLICY, mcpDoctorDeadlineRecovery, mcpProviderDeadlineAllowanceMs, recommendedMcpToolTimeoutMs, recommendedMcpToolTimeoutSeconds;
function init_mcpStartupPolicy() {
	return (init_mcpStartupPolicy = __esmMin((() => {
		init_mcpStartupBudgets();
		MCP_STARTUP_POLICY = {
			codexStartupTimeoutSeconds: 30,
			kimiStartupTimeoutMs: 3e4,
			toolOperationHeadroomMs: 12e4,
			doctorStderrBytes: 64 * 1024
		};
		mcpDoctorDeadlineRecovery = (budget) => `${mcpPhaseBudgetRecovery(budget)} Codex startup_timeout_sec of ${String(MCP_STARTUP_POLICY.codexStartupTimeoutSeconds)} seconds is client guidance; REA does not enforce that figure as this deadline.`;
		mcpProviderDeadlineAllowanceMs = (inputs) => {
			const selectedProvider = inputs.analysisProvider;
			const ghidraAllowance = inputs.ghidraStartupTimeoutMs + (inputs.ghidraDecompileTimeoutMs ?? 0);
			const selectedTimeout = selectedProvider === "ghidra" ? ghidraAllowance : selectedProvider === "hopper" ? inputs.hopperStartupTimeoutMs : Math.max(ghidraAllowance, inputs.hopperStartupTimeoutMs);
			return Math.max(selectedTimeout, inputs.jebMcpTimeoutMs ?? 0, inputs.providerRequestTimeoutMs ?? 0);
		};
		recommendedMcpToolTimeoutMs = (inputs) => mcpProviderDeadlineAllowanceMs(inputs) + MCP_STARTUP_POLICY.toolOperationHeadroomMs;
		recommendedMcpToolTimeoutSeconds = (inputs) => Math.ceil(recommendedMcpToolTimeoutMs(inputs) / 1e3);
	})))();
}

//#endregion
export { MCP_STARTUP_POLICY, init_mcpStartupPolicy, mcpDoctorDeadlineRecovery, mcpProviderDeadlineAllowanceMs, recommendedMcpToolTimeoutMs, recommendedMcpToolTimeoutSeconds };
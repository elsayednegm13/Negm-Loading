import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_analysisErrorBase, t as AnalysisError } from "./analysisErrorBase-BNnZv0cP.js";
import { n as projectAnalysisError, t as init_analysisErrorProjection } from "./analysisErrorProjection-CbRgJX1L.js";

//#region dist/main/messages.js
var MCP_CONNECTION_LOST, MCP_CONNECTION_START_FAILED, MCP_SHUTDOWN_FAILED, SERVER_START_FAILED, MCP_HTTP_LISTEN_FAILED;
function init_messages() {
	return (init_messages = __esmMin((() => {
		MCP_CONNECTION_LOST = "Retry the tool call once only when it is safe to repeat or known not to have started. If it may already have changed the target, or it fails again, tell the user REA lost its MCP client connection and ask them to restart the MCP client.";
		MCP_CONNECTION_START_FAILED = "Retry once. If it fails again, tell the user REA could not start its MCP connection and ask them to restart the MCP client, then run `rea doctor`.";
		MCP_SHUTDOWN_FAILED = "REA could not close cleanly. End the REA process before starting it again.";
		SERVER_START_FAILED = "Do not repeat this startup. Tell the user REA could not start and ask them to restart the MCP client, then run `rea doctor`.";
		MCP_HTTP_LISTEN_FAILED = "REA could not listen for MCP HTTP connections on the selected host and port. Choose another --port or stop the process using it.";
	})))();
}

//#endregion
//#region dist/main/shutdown.js
var createShutdown, reportMcpShutdownFailure, describeShutdownFailure, describeShutdownFailureNode;
function init_shutdown() {
	return (init_shutdown = __esmMin((() => {
		init_analysisErrorBase();
		init_analysisErrorProjection();
		init_messages();
		createShutdown = (input) => {
			const { handle, session, dependencies, serverLogger } = input;
			let shutdownAttempt;
			const cleanupOwners = [
				{
					close: () => handle.close(),
					closed: false
				},
				...input.closeAndroid === undefined ? [] : [{
					close: input.closeAndroid,
					closed: false
				}],
				...input.closeOptionalProviders === undefined ? [] : [{
					close: input.closeOptionalProviders,
					closed: false
				}],
				{
					close: async () => {
						const closed = await session.close({ retainProviderDocuments: true });
						if (!closed.ok) throw closed.error;
					},
					closed: false
				}
			];
			let shutdownUnregistered = false;
			let unregisterShutdown = () => undefined;
			const shutdown = async () => {
				if (shutdownAttempt !== undefined) return shutdownAttempt;
				const pending = cleanupOwners.filter(({ closed }) => !closed);
				const attempt = (async () => {
					session.beginShutdown();
					await handle.prepareShutdown?.();
					const results = await Promise.allSettled(pending.map(async (owner) => {
						await owner.close();
						owner.closed = true;
					}));
					const failures = [];
					for (const result of results) if (result.status === "rejected") failures.push(result.reason);
					if (failures.length === 1) throw failures[0];
					if (failures.length > 1) throw new AggregateError(failures, "Multiple MCP cleanup operations failed");
					if (!shutdownUnregistered) {
						unregisterShutdown();
						shutdownUnregistered = true;
					}
				})();
				shutdownAttempt = attempt;
				void attempt.catch(() => {
					if (shutdownAttempt === attempt) shutdownAttempt = undefined;
				});
				return attempt;
			};
			const requestShutdown = () => {
				shutdown().catch((cause) => {
					reportMcpShutdownFailure(cause, dependencies, serverLogger);
				});
			};
			unregisterShutdown = dependencies.registerShutdown(requestShutdown);
			return {
				shutdown,
				request: requestShutdown
			};
		};
		reportMcpShutdownFailure = (cause, dependencies, serverLogger) => {
			serverLogger.debug({ failure_cause: describeShutdownFailure(cause) }, "MCP shutdown rejected");
			dependencies.setExitCode(1);
			serverLogger.error(MCP_SHUTDOWN_FAILED);
			dependencies.writeStderr(`${MCP_SHUTDOWN_FAILED}\n`);
			if (cause instanceof AnalysisError) dependencies.writeStderr(`${projectAnalysisError(cause).message}\n`);
		};
		describeShutdownFailure = (cause) => describeShutdownFailureNode(cause, new WeakSet());
		describeShutdownFailureNode = (cause, active) => {
			if (typeof cause === "object" && cause !== null) {
				if (active.has(cause)) return { type: "cyclic_error" };
				active.add(cause);
			}
			try {
				if (cause instanceof AnalysisError) return { analysis_error: projectAnalysisError(cause) };
				if (cause instanceof Error) {
					const code = "code" in cause ? cause.code : undefined;
					return {
						name: cause.name,
						message: cause.message,
						...typeof code === "string" || typeof code === "number" && Number.isFinite(code) ? { code } : {},
						...cause instanceof AggregateError ? { errors: cause.errors.map((error) => describeShutdownFailureNode(error, active)) } : {}
					};
				}
				if (cause === null || typeof cause === "string" || typeof cause === "boolean" || typeof cause === "number" && Number.isFinite(cause)) return {
					type: cause === null ? "null" : typeof cause,
					value: cause
				};
				return { type: typeof cause };
			} finally {
				if (typeof cause === "object" && cause !== null) active.delete(cause);
			}
		};
	})))();
}

//#endregion
//#region dist/main/OwnedMcpServers.js
var OwnedMcpServers;
function init_OwnedMcpServers() {
	return (init_OwnedMcpServers = __esmMin((() => {
		OwnedMcpServers = class {
			servers = new Map();
			accepting = true;
			create(factory) {
				if (!this.accepting) throw new Error("MCP connection is closed");
				const server = factory();
				const close = server.close.bind(server);
				const ownedClose = async () => {
					await close();
					this.servers.delete(server);
				};
				this.servers.set(server, ownedClose);
				server.close = ownedClose;
				return server;
			}
			/** Seal publication before snapshotting; failed close capabilities stay owned. */
			closeAll() {
				this.accepting = false;
				return Promise.allSettled([...this.servers.values()].map((close) => Promise.resolve().then(close)));
			}
		};
	})))();
}

//#endregion
export { reportMcpShutdownFailure as a, MCP_HTTP_LISTEN_FAILED as c, init_shutdown as i, SERVER_START_FAILED as l, init_OwnedMcpServers as n, MCP_CONNECTION_LOST as o, createShutdown as r, MCP_CONNECTION_START_FAILED as s, OwnedMcpServers as t, init_messages as u };
import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { PRODUCT_IDENTITY, init_identity, init_safeJson, safeParseJson } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { err, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { RegularFileCleanupFailure, init_OwnedRegularFile } from "./ArtifactReader-PV1DaSaC.js";
import { ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-BLhM2W5p.js";
import { ProviderProcessSupervisor, init_ProviderProcess } from "./ProviderProcess-DdOAhfXm.js";
import { init_ClientRegistrationIdentity, withoutPackageRunnerIdentity } from "./SupportedClients-cYThuJwT.js";
import { homeDirectoryFromEnvironment, init_homeDirectory } from "./homeDirectory-CgrzFhoH.js";
import { existingSkillDestinations, init_SetupSkill } from "./ClientRegistration-Cl3KCjlr.js";
import { init_ClientRegistrationStatus, readClientRegistrationInspections } from "./ClientRegistrationStatus-aqdlo2F2.js";
import { init_Update, updateInstallCommand } from "./Update-Byw1Rxxf.js";
import { z } from "zod";
import { basename, dirname, join, resolve } from "node:path";
import { realpath, stat } from "node:fs/promises";
import { finished } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { Writable } from "node:stream";
import { lt, valid } from "semver";
import spawn from "cross-spawn";

//#region dist/application/UpdateCommandProgress.js
var UpdateCommandProgress;
function init_UpdateCommandProgress() {
	return (init_UpdateCommandProgress = __esmMin((() => {
		UpdateCommandProgress = class {
			destination;
			#streams = [];
			#sink;
			#finished;
			#closing;
			#failed = false;
			#pendingWrites = 0;
			#closed = false;
			#onDestinationError = (cause) => {
				this.#sink.destroy(cause);
			};
			constructor(destination) {
				this.destination = destination;
				this.#sink = new Writable({ write: (chunk, encoding, callback) => {
					this.#pendingWrites++;
					destination.write(chunk, encoding, (cause) => {
						this.#pendingWrites--;
						callback(cause);
						setImmediate(() => this.#releaseDestination());
					});
				} });
				this.#finished = finished(this.#sink, { cleanup: true }).then(() => undefined, (cause) => {
					this.#failed = true;
					for (const stream of this.#streams) {
						stream.unpipe(this.#sink);
						stream.resume();
					}
					return cause instanceof Error ? cause : new Error(String(cause));
				});
				destination.on("error", this.#onDestinationError);
			}
			pipe(stream) {
				this.#streams.push(stream);
				if (this.#failed) stream.resume();
				else stream.pipe(this.#sink, { end: false });
			}
			close() {
				this.#closing ??= this.#close();
				return this.#closing;
			}
			async #close() {
				for (const stream of this.#streams) stream.unpipe(this.#sink);
				this.#sink.end();
				try {
					return await this.#finished;
				} finally {
					this.#closed = true;
					setImmediate(() => this.#releaseDestination());
				}
			}
			#releaseDestination() {
				if (this.#closed && this.#pendingWrites === 0) this.destination.off("error", this.#onDestinationError);
			}
		};
	})))();
}

//#endregion
//#region dist/application/UpdateMaintenance.js
var setupPlanSchema, existingMaintenanceScope, planIntegrationMaintenance;
function init_UpdateMaintenance() {
	return (init_UpdateMaintenance = __esmMin((() => {
		init_OwnedRegularFile();
		init_ClientRegistrationStatus();
		init_SetupSkill();
		setupPlanSchema = z.object({
			status: z.literal("planned"),
			plannedActions: z.array(z.object({
				id: z.string(),
				kind: z.enum(["configure_client", "install_skill"]),
				label: z.string(),
				target: z.string(),
				detail: z.string(),
				external: z.literal(false),
				operation: z.enum([
					"create",
					"update",
					"install"
				]),
				backupPath: z.string().optional(),
				commands: z.array(z.string()).optional()
			}))
		});
		existingMaintenanceScope = async (home, entryPoint, environment, resources) => {
			const registrations = await readClientRegistrationInspections(home, entryPoint, {
				environment,
				evidence: "ownership",
				...resources === undefined ? {} : { resources }
			});
			const clients = [];
			const unresolved = [];
			for (const { status: registration, activation, commandIdentity } of registrations) {
				if (registration.state === "unknown" || registration.state === "invalid") {
					unresolved.push(registration);
					continue;
				}
				if (activation !== "enabled" || registration.state !== "aligned" && registration.state !== "stale" || commandIdentity !== "owned") continue;
				clients.push(registration.client);
			}
			const skills = await existingSkillDestinations(home, environment, process.platform, resources);
			return {
				clients,
				skill: skills.destinations.length > 0,
				skillDestinations: skills.destinations,
				...skills.issues.length === 0 ? {} : { skillIssues: skills.issues },
				...unresolved.length === 0 ? {} : { unresolved }
			};
		};
		planIntegrationMaintenance = async (home, entryPoint, environment, execute, resources) => {
			try {
				const scope = await existingMaintenanceScope(home, entryPoint, environment, resources);
				if ((scope.unresolved?.length ?? 0) > 0 || (scope.skillIssues?.length ?? 0) > 0) return {
					status: "unavailable",
					scope,
					remediation: `Integration maintenance is unresolved: ${[...(scope.unresolved ?? []).map(({ client, config_path, remediation }) => `${client} (${config_path}): ${remediation ?? "Registration identity is unresolved"}`), ...(scope.skillIssues ?? []).map(({ client, path, detail }) => `${client ?? "skill"} (${path}): ${detail}`)].join(" ")}`
				};
				const skillDestinations = scope.skillDestinations ?? [];
				if (scope.clients.length === 0 && !scope.skill) return {
					status: "current",
					plannedActions: []
				};
				const command = [
					process.execPath,
					entryPoint,
					"setup",
					...scope.clients.flatMap((client) => ["--client", client]),
					...skillDestinations.flatMap(({ client }) => ["--skill-client", client]),
					`--skill=${String(scope.skill)}`
				];
				const execution = await execute([
					...command,
					"--dry-run",
					"--json"
				]);
				if (!execution.ok) return {
					status: "unavailable",
					remediation: execution.error
				};
				const plan = setupPlanSchema.safeParse(JSON.parse(execution.value));
				if (!plan.success) return {
					status: "unavailable",
					remediation: `The updated setup executable returned an invalid maintenance plan: ${plan.error.message}`
				};
				if (plan.data.plannedActions.length === 0) return {
					status: "current",
					plannedActions: []
				};
				const allowedIds = new Set(scope.clients.map((client) => `configure_client:${client}`));
				const skillTargets = new Set(skillDestinations.map(({ path }) => path));
				if (plan.data.plannedActions.some((action) => action.kind === "install_skill" ? !skillTargets.has(action.target) : !allowedIds.has(action.id))) return {
					status: "unavailable",
					remediation: "The updated setup plan included an integration outside the existing REA maintenance scope."
				};
				return {
					status: "planned",
					scope,
					command,
					plannedActions: plan.data.plannedActions.map(({ backupPath, commands, ...action }) => ({
						...action,
						...backupPath === undefined ? {} : { backupPath },
						...commands === undefined ? {} : { commands }
					}))
				};
			} catch (cause) {
				if (resources === undefined && cause instanceof RegularFileCleanupFailure) throw cause;
				return {
					status: "unavailable",
					remediation: cause instanceof Error ? cause.message : String(cause)
				};
			}
		};
	})))();
}

//#endregion
//#region dist/application/UpdateRuntime.js
var UPDATE_COMMAND_OUTPUT_BYTES, runUpdateCommand, runUpdateProcess, requireCommandOutput, detectNpmInstallation, nonemptyEnvironment, bunGlobalDirectory, detectBunInstallation, INVALID_NPM_RELEASE_METADATA, BUN_LATEST_VERSION_COMMAND, npmLatestVersionCommand, parseNpmLatestVersion, readNpmLatestVersion, nonemptyVersion, npmReleaseLookup, isFile, packageManagerContext, systemUpdateHost;
function init_UpdateRuntime() {
	return (init_UpdateRuntime = __esmMin((() => {
		init_homeDirectory();
		init_ProviderProcess();
		init_UpdateCommandProgress();
		init_identity();
		init_ArtifactResourceScope();
		init_result();
		init_safeJson();
		init_Update();
		init_UpdateMaintenance();
		init_ClientRegistrationIdentity();
		UPDATE_COMMAND_OUTPUT_BYTES = 4 * 1024 * 1024;
		runUpdateCommand = (command, selectedEnvironment, output = "structured", workingDirectory = undefined) => runUpdateProcess(command, selectedEnvironment, output, workingDirectory, "complete");
		runUpdateProcess = async (command, selectedEnvironment, output, workingDirectory, retention) => {
			const [executable, ...args] = command;
			if (executable === undefined) return err("No executable supplied.");
			const environment = withoutPackageRunnerIdentity(selectedEnvironment);
			const child = spawn(executable, args, {
				stdio: [
					"ignore",
					"pipe",
					"pipe"
				],
				env: environment,
				windowsHide: true,
				...workingDirectory === undefined ? {} : { cwd: workingDirectory }
			});
			let processFailure;
			const supervisor = new ProviderProcessSupervisor({
				process: child,
				ownsProcessLifetime: true
			}, {
				maxDiagnosticBytes: UPDATE_COMMAND_OUTPUT_BYTES,
				onDiagnostic: (event) => {
					if (event.type === "error") processFailure ??= event.message;
				}
			});
			const progress = output === "human" ? new UpdateCommandProgress(process.stderr) : undefined;
			if (progress !== undefined) {
				for (const stream of [child.stdout, child.stderr]) if (stream !== null) progress.pipe(stream);
			}
			try {
				await supervisor.waitForOutputClose();
				const progressFailure = await progress?.close();
				const snapshot = supervisor.snapshot();
				if (processFailure !== undefined) return err(processFailure);
				if (snapshot.outputIncomplete === true) return err("Update command output did not close completely.");
				if (retention === "complete" && snapshot.diagnosticTruncated === true) return err(`Update command output exceeded the ${UPDATE_COMMAND_OUTPUT_BYTES}-byte complete-output retention budget; reply was not accepted.`);
				if (snapshot.exitCode !== 0 || snapshot.signal !== null) {
					const detail = snapshot.stderr.text.trim() || snapshot.stdout.text.trim() || (typeof snapshot.signal === "string" ? `Process terminated by ${snapshot.signal}.` : typeof snapshot.exitCode === "number" ? `Process exited with code ${snapshot.exitCode}.` : "Update command failed without a recorded exit status.");
					return err(snapshot.diagnosticTruncated ? `${detail}\n[Update diagnostics truncated at ${UPDATE_COMMAND_OUTPUT_BYTES} bytes; later output omitted.]` : detail);
				}
				if (retention === "complete" && (snapshot.stdout.invalidUtf8 || snapshot.stderr.invalidUtf8)) return err("Update command returned invalid UTF-8; complete output is unavailable.");
				if (progressFailure !== undefined) return err(`Update progress output failed: ${progressFailure.message}`);
				return ok(retention === "diagnostics" ? "" : snapshot.stdout.text.trim());
			} finally {
				supervisor.dispose();
				await progress?.close();
			}
		};
		requireCommandOutput = async (command, environment) => {
			const result = await runUpdateCommand(command, environment);
			if (!result.ok) throw new Error(result.error);
			return result.value;
		};
		detectNpmInstallation = async (packageRoot, host) => {
			let canonicalPackageRoot;
			try {
				canonicalPackageRoot = await host.canonicalPath(packageRoot);
			} catch (cause) {
				void cause;
				return undefined;
			}
			try {
				const npmRoot = await host.globalRoot();
				const globalPackageRoot = await host.canonicalPath(resolve(npmRoot, PRODUCT_IDENTITY.packageName));
				if (canonicalPackageRoot === globalPackageRoot) {
					const prefix = await host.globalPrefix();
					return prefix.length === 0 ? undefined : {
						manager: "npm",
						prefix,
						packageRoot: canonicalPackageRoot
					};
				}
			} catch (cause) {
				void cause;
			}
			const nodeModules = dirname(canonicalPackageRoot);
			const library = dirname(nodeModules);
			if (basename(canonicalPackageRoot) !== PRODUCT_IDENTITY.packageName || basename(nodeModules) !== "node_modules" || basename(library) !== "lib") return undefined;
			return {
				manager: "npm",
				prefix: dirname(library),
				packageRoot: canonicalPackageRoot
			};
		};
		nonemptyEnvironment = (value) => value === undefined || value.length === 0 ? undefined : value;
		bunGlobalDirectory = (environment, platform) => {
			const explicit = nonemptyEnvironment(environment.BUN_INSTALL_GLOBAL_DIR);
			if (explicit !== undefined) return resolve(explicit);
			const installRoot = nonemptyEnvironment(environment.BUN_INSTALL);
			if (installRoot !== undefined) return resolve(installRoot, "install", "global");
			const cacheRoot = nonemptyEnvironment(environment.XDG_CACHE_HOME) ?? homeDirectoryFromEnvironment(environment, platform);
			return resolve(cacheRoot, ".bun", "install", "global");
		};
		detectBunInstallation = async (packageRoot, globalDirectory, host) => {
			try {
				const canonicalPackageRoot = await host.canonicalPath(packageRoot);
				const globalPackageRoot = await host.canonicalPath(join(globalDirectory, "node_modules", PRODUCT_IDENTITY.packageName));
				if (canonicalPackageRoot !== globalPackageRoot || !await host.isFile(join(globalDirectory, "package.json"))) return undefined;
				return {
					manager: "bun",
					globalDirectory,
					packageRoot: canonicalPackageRoot
				};
			} catch (cause) {
				void cause;
				return undefined;
			}
		};
		INVALID_NPM_RELEASE_METADATA = "Invalid npm release metadata: expected a version string or a single-element version array.";
		BUN_LATEST_VERSION_COMMAND = [
			"bun",
			"info",
			PRODUCT_IDENTITY.packageName,
			"dist-tags.latest",
			"--json"
		];
		npmLatestVersionCommand = (installation) => [
			"npm",
			"view",
			"--global",
			...installation === undefined ? [] : ["--prefix", installation.prefix],
			PRODUCT_IDENTITY.packageName,
			"dist-tags.latest",
			"--json",
			"--fetch-retries=0",
			"--fetch-timeout=10000"
		];
		parseNpmLatestVersion = (metadata) => {
			const decoded = safeParseJson(metadata);
			if (!decoded.ok) return err(decoded.error);
			const version = readNpmLatestVersion(decoded.value);
			return version === undefined ? err(INVALID_NPM_RELEASE_METADATA) : ok(version);
		};
		readNpmLatestVersion = (value) => {
			if (typeof value === "string") return nonemptyVersion(value);
			if (!Array.isArray(value) || value.length !== 1) return undefined;
			const only = value[0];
			return typeof only === "string" ? nonemptyVersion(only) : undefined;
		};
		nonemptyVersion = (value) => value.length === 0 ? undefined : value;
		npmReleaseLookup = (response) => {
			if (!response.ok) return err({
				kind: "unavailable",
				detail: response.error
			});
			const parsed = parseNpmLatestVersion(response.value);
			return parsed.ok ? ok(parsed.value) : err({
				kind: "invalid-metadata",
				detail: parsed.error
			});
		};
		isFile = async (path) => {
			try {
				return (await stat(path)).isFile();
			} catch (cause) {
				void cause;
				return false;
			}
		};
		packageManagerContext = (installation, environment) => installation?.manager === "bun" ? {
			environment: {
				...environment,
				BUN_INSTALL_GLOBAL_DIR: installation.globalDirectory
			},
			workingDirectory: installation.globalDirectory
		} : {
			environment,
			workingDirectory: undefined
		};
		systemUpdateHost = (packageRoot = fileURLToPath(new URL("../..", new URL("../application/UpdateRuntime.js", import.meta.url).href)), home = undefined, environment = process.env) => {
			const resources = new ArtifactResourceScope();
			return {
				installation: async () => await detectBunInstallation(packageRoot, bunGlobalDirectory(environment, process.platform), {
					canonicalPath: realpath,
					isFile
				}) ?? detectNpmInstallation(packageRoot, {
					canonicalPath: realpath,
					globalRoot: () => requireCommandOutput([
						"npm",
						"root",
						"--global"
					], environment),
					globalPrefix: () => requireCommandOutput([
						"npm",
						"prefix",
						"--global"
					], environment)
				}),
				latestVersion: async (installation) => {
					const context = packageManagerContext(installation, environment);
					if (installation?.manager === "bun") {
						const version = await runUpdateCommand(["bun", "--version"], context.environment, "structured", context.workingDirectory);
						if (!version.ok) return err({
							kind: "unavailable",
							detail: version.error
						});
						const bunVersion = valid(version.value);
						if (bunVersion === null || lt(bunVersion, "1.2.17")) return err({
							kind: "unsupported-package-manager",
							detail: `REA updates for Bun global installations require Bun 1.2.17 or later; bun --version returned ${JSON.stringify(version.value)}. Upgrade Bun manually, then rerun rea update.`
						});
					}
					return npmReleaseLookup(await runUpdateCommand(installation?.manager === "bun" ? BUN_LATEST_VERSION_COMMAND : npmLatestVersionCommand(installation), context.environment, "structured", context.workingDirectory));
				},
				installVersion: async (installation, version, output) => {
					const context = packageManagerContext(installation, environment);
					const result = await runUpdateProcess(updateInstallCommand(installation, version), context.environment, output, context.workingDirectory, "diagnostics");
					return result.ok ? ok(undefined) : result;
				},
				installedVersion: (installation) => runUpdateCommand([
					process.execPath,
					join(installation.packageRoot, "scripts", "rea.mjs"),
					"--version"
				], environment),
				planMaintenance: (installation) => planIntegrationMaintenance(home ?? homeDirectoryFromEnvironment(environment, process.platform), join(installation.packageRoot, "scripts", "rea.mjs"), environment, (command) => runUpdateCommand(command, environment), resources),
				close: async () => {
					try {
						await resources.close();
						return undefined;
					} catch (cause) {
						return `Update resource cleanup failed: ${cause instanceof Error ? cause.message : String(cause)}`;
					}
				}
			};
		};
	})))();
}

//#endregion
init_UpdateRuntime();
export { BUN_LATEST_VERSION_COMMAND, UPDATE_COMMAND_OUTPUT_BYTES, bunGlobalDirectory, detectBunInstallation, detectNpmInstallation, npmLatestVersionCommand, npmReleaseLookup, parseNpmLatestVersion, runUpdateCommand, systemUpdateHost };
import { __esmMin, __exportAll } from "./rolldown-runtime-DXoylpqc.js";
import { PRODUCT_IDENTITY, analysisProviderSelectorSchema, compareUnicodeCodePoints, init_identity, init_providerSelection, init_unicodeCodePointOrder } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisError, ConfigurationError, err, init_analysisErrorBase, init_configurationErrors, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { ArtifactReaderFailure, RegularFileChangedError, RegularFileCleanupFailure, init_ArtifactReader, init_OwnedRegularFile, init_RegularFile } from "./ArtifactReader-PV1DaSaC.js";
import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-DZIxbgES.js";
import { InvalidUtf8FileError, bindRegularFileCleanup, init_RegularFileRead, readRegularFileText, readRegularFileTextSnapshot } from "./RegularFileRead-4snB6-IE.js";
import { ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-BLhM2W5p.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-CdFjQgxe.js";
import { cleanupWindowsProcessTree, init_ProcessOwnership } from "./ProcessOwnership-BIq-8nU3.js";
import { init_snapshotEnvironment, snapshotEnvironment } from "./snapshotEnvironment-Dxega7Jt.js";
import { clientEvidencePaths, init_ClientRegistrationIdentity, init_MsixPackageStorage, init_SupportedClients, inspectClientRegistrationCommand, invokingPackageRunner, msixPackagesDirectory, npxRegistrationCommand, packagePrivateLauncherBlocker, packageReadTargetChanged, packageRunnerRegistrationCommand, registrationEntrypointPath, registrationWriteBlocker, supportedClients } from "./SupportedClients-cYThuJwT.js";
import { homeDirectoryFromEnvironment, init_homeDirectory } from "./homeDirectory-CgrzFhoH.js";
import { SUPPORTED_NODE_VERSION_PROSE, init_runtimeVersion, supportsNodeVersion } from "./cliOutput-3g9bk55s.js";
import { LinuxHopperTemporaryCleanupOwner, init_LinuxHopper, installLinuxHopper, systemLinuxHopperInstallHost } from "./SharedStartupAttempt-BObuC52s.js";
import { HOPPER_DOWNLOAD_BYTES, HOPPER_LINUX_PRIMARY_FINGERPRINT, downloadHopperPackage, init_HopperDownload, init_HopperReleaseFeed, init_LinuxHopperCacheDirectory, linuxHopperReleaseCacheDirectory } from "./LinuxHopperCacheDirectory-DrnvgmLm.js";
import { init_MacHopperPaths, macHopperUserApplicationPath } from "./parseConfig-CnsaJFUY.js";
import { CURRENT_ENTRYPOINT_PATH, init_CurrentEntrypointPath } from "./CurrentEntrypointPath-m7QCIVN0.js";
import { init_Doctor, runDoctor, systemDoctorHost } from "./Doctor-BLZnkeII.js";
import { DshCordisDocument, OMP_DISABLED_SERVERS_KEY, canonicalSkillNeedsInstall, clientConfigurationValuesEqual, clientServerListedDisabled, clientServerPath, dshDocument, effectiveClientServer, init_ClientConfigurationDocument, init_ClientRegistration, init_DshCordisPatch, init_SetupRecoveryBackup, init_SetupSkill, installCanonicalSkill, legacyClientServerPath, parseClientConfiguration, parseZcodeFallbackConfiguration, preserveCurrentRecoveryBackup, refreshClientRegistration, selectCurrentRecoveryBackup, serializeClientConfiguration, skillDestinations, validateCanonicalSkillDirectories, withClientServers } from "./ClientRegistration-Cl3KCjlr.js";
import { clientConfigurationForWrite, clientRegistrationEnvironment, clientRegistrationEnvironmentDetailsWithBudget, clientWriteDialect, effectiveClientConfiguration, init_ClientConfigurationFiles, init_ClientRegistrationEnvironment, init_GeminiClientSettings, readClientConfigurationFiles, readClientPolicyBlock, readConfigurationText } from "./ClientRegistrationStatus-aqdlo2F2.js";
import { HOPPER_PUBLISHER, init_MacCodeSignature, init_hopperPublisher, macDeveloperIdRequirement } from "./MacCodeSignature-MgYbRK_H.js";
import { ClientConfigurationPublication, ClientConfigurationWriteError, init_ClientConfigPath, init_ClientConfigurationCleanup, init_ClientConfigurationPublication, isClientConfigurationCleanupFailure, resolveClientConfigTransactionPath, retryClientConfigurationCleanup } from "./ClientConfigurationPublication-BsBbLYjI.js";
import { z } from "zod";
import { createHash } from "node:crypto";
import { dirname, join, posix, resolve } from "node:path";
import { promisify } from "node:util";
import { access, mkdir, mkdtemp, readdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { execFile, spawn } from "node:child_process";

//#region dist/application/SetupClients.js
var failedConfigurationMessage, configureDetectedClients;
function init_SetupClients() {
	return (init_SetupClients = __esmMin((() => {
		failedConfigurationMessage = (result) => {
			switch (result.reason) {
				case "conflict": return "Agent configuration changed during setup. Review the current file and rerun setup.";
				case "target_changed": return "The client began reading a different configuration file after the plan was shown, so no change was made. Rerun setup to review the new target.";
				case "target_unavailable": return `The client configuration read target could not be established because ${result.failure.path} could not be inspected: ${result.failure.detail}. Repair access to that path, then rerun setup.`;
				case "path": return "Agent configuration path could not be safely verified. Check its permissions and, if it is a symbolic link, verify that the link resolves to a regular file owned by the current user, then rerun setup.";
				case "backup": return "Agent configuration could not be backed up, so no change was made. Check file permissions, then rerun setup.";
				case "write": {
					if (result.failure === undefined) return "Agent configuration could not be updated. Check file permissions, then rerun setup.";
					const failure = result.failure;
					const operation = failure.operation === "preserve_ownership" ? `preserve owner/group${failure.requestedOwnership === undefined ? "" : ` ${failure.requestedOwnership.uid}:${failure.requestedOwnership.gid}`}` : failure.operation.replaceAll("_", " ");
					const reason = failure.systemCode === undefined ? failure.detail : `${failure.systemCode}: ${failure.detail}`;
					const recovery = result.backupPath === undefined ? "" : ` The backup remains at ${result.backupPath}.`;
					return `Agent configuration could not ${operation} at ${failure.path}: ${reason}.${recovery} Review the reported operation and file ownership or permissions before rerunning setup.`;
				}
				case "shadowed_member": return `Agent configuration repeats the member at ${JSON.stringify(result.path)}; removing the member the client reads would activate an earlier duplicate, so no change was made. Remove the duplicate members, then rerun setup.`;
				case "rollback": return result.backupPath === undefined ? `Agent configuration rollback failed at ${result.failure.path}: ${result.failure.detail}; the failed first-run file may remain. Remove or repair it before rerunning setup.` : `Agent configuration rollback failed at ${result.failure.path}: ${result.failure.detail}. Inspect the preserved backup at ${result.backupPath} and restore the intended configuration, then rerun setup.`;
				case "readback": return result.backupPath === undefined ? "Agent configuration could not be verified. Repair the configuration file, then rerun setup." : `Agent configuration could not be verified after writing. The original was restored and its backup at ${result.backupPath} was retained. Repair the configuration file or restore that backup, then rerun setup.`;
			}
		};
		configureDetectedClients = async (options) => {
			let failure;
			for (const client of options.detectedClients) {
				const actionId = `configure_client:${client.name}`;
				const label = client.displayName ?? client.name;
				options.onProgress?.({
					actionId,
					label,
					state: "started"
				});
				const result = await options.host.configureClient(client, options.providerEnvironment, options.command);
				options.clients[client.name] = result;
				if (result.status === "failed") {
					failure ??= failedConfigurationMessage(result);
					options.onProgress?.({
						actionId,
						label,
						state: "failed",
						detail: failedConfigurationMessage(result)
					});
				} else if (result.status === "configured") {
					options.appliedActions.push(`configured_${client.name}`);
					options.onProgress?.({
						actionId,
						label,
						state: "completed"
					});
				} else {
					options.onProgress?.({
						actionId,
						label,
						state: "warning",
						detail: result.status === "unchanged" ? "Already current" : "Manual configuration required"
					});
				}
			}
			return failure;
		};
	})))();
}

//#endregion
//#region dist/application/MacHopper.js
var execFileAsync, RELEASES_URL, DOWNLOAD_PREFIX, HOPPER_PUBLISHER_REQUIREMENT, macHopperInstallDisclosure, installMacHopper, installMacHopperBundle, systemMacHopperInstallHost, parseJson, integrityMatches, commandSucceeds, failureMessage, isMissingPath, pathExists, releaseSchema, releasesSchema;
function init_MacHopper() {
	return (init_MacHopper = __esmMin((() => {
		init_homeDirectory();
		init_hopperPublisher();
		init_MacCodeSignature();
		init_MacHopperPaths();
		init_HopperDownload();
		execFileAsync = promisify(execFile);
		RELEASES_URL = "https://www.hopperapp.com/include/files-api.php?request=releases&public=true";
		DOWNLOAD_PREFIX = "https://www.hopperapp.com:443/downloader/public/";
		HOPPER_PUBLISHER_REQUIREMENT = macDeveloperIdRequirement(HOPPER_PUBLISHER.bundleIdentifier, HOPPER_PUBLISHER.teamIdentifier);
		macHopperInstallDisclosure = {
			networkOrigins: [RELEASES_URL, DOWNLOAD_PREFIX],
			commands: [
				"hdiutil attach -readonly -nobrowse -mountpoint <private-mount> <verified-hopper.dmg>",
				"codesign --verify --deep --strict <mounted-hopper.app>",
				`codesign --verify --strict '-R${HOPPER_PUBLISHER_REQUIREMENT}' <mounted-hopper.app>`,
				"ditto <mounted-hopper.app> <user-Applications-stage>",
				"open <installed-hopper.app>"
			]
		};
		installMacHopper = async (options = {}, host = systemMacHopperInstallHost(homeDirectoryFromEnvironment(process.env, process.platform), process.env)) => {
			let temporary;
			let mounted = false;
			let bundleCleanupFailure;
			let installStage = "release_metadata";
			let result;
			try {
				result = await (async () => {
					const metadata = await host.download(RELEASES_URL);
					if (!metadata.ok) return {
						status: "failed",
						reason: "release_metadata"
					};
					const parsed = releasesSchema.safeParse(parseJson(metadata.bytes));
					if (!parsed.success) return {
						status: "failed",
						reason: "release_metadata"
					};
					const release = parsed.data["OS X"];
					if (!release.filename.startsWith(DOWNLOAD_PREFIX)) return {
						status: "failed",
						reason: "release_metadata"
					};
					installStage = "download";
					const archive = await host.download(release.filename);
					if (!archive.ok) return {
						status: "failed",
						reason: "download"
					};
					installStage = "integrity";
					if (!integrityMatches(archive.bytes, release)) return {
						status: "failed",
						reason: "integrity"
					};
					installStage = "destination_inspection";
					const destination = host.destination();
					const destinationExists = await host.destinationExists(destination);
					if (destinationExists && options.replaceExisting !== true) return {
						status: "failed",
						reason: "destination_exists"
					};
					installStage = "mount";
					temporary = await host.createTemporaryDirectory();
					const packagePath = posix.join(temporary, "hopper.dmg");
					const mountPath = posix.join(temporary, "mounted");
					await host.createMountDirectory(mountPath);
					await host.writePackage(packagePath, archive.bytes);
					if (!await host.mount(packagePath, mountPath)) return {
						status: "failed",
						reason: "mount"
					};
					mounted = true;
					installStage = "bundle";
					const source = await host.appBundle(mountPath);
					if (source === undefined) return {
						status: "failed",
						reason: "bundle"
					};
					const verification = await host.validBundle(source);
					if (verification === "invalid_signature") return {
						status: "failed",
						reason: "bundle"
					};
					if (verification === "unverified_publisher") return {
						status: "failed",
						reason: "publisher_verification_failed"
					};
					installStage = "copy";
					const installation = await host.installBundle(source, destination, destinationExists);
					if (installation.status === "failed") return {
						status: "failed",
						reason: installation.reason,
						diagnostic: installation.diagnostic,
						...installation.cleanupFailure === undefined ? {} : { cleanupFailure: installation.cleanupFailure }
					};
					bundleCleanupFailure = installation.cleanupFailure;
					const launcherPath = posix.join(destination, "Contents/MacOS/hopper");
					let openFailure;
					try {
						await host.openApplication(destination);
					} catch (cause) {
						openFailure = failureMessage(cause);
					}
					return {
						status: "installed",
						launcherPath,
						...openFailure === undefined ? {} : { openFailure }
					};
				})();
			} catch (cause) {
				result = {
					status: "failed",
					reason: installStage,
					diagnostic: failureMessage(cause)
				};
			}
			let cleanupFailure;
			if (temporary !== undefined) {
				const temporaryPath = temporary;
				const mountPath = posix.join(temporary, "mounted");
				const cleanup = async () => {
					if (mounted) {
						await host.unmount(mountPath);
						mounted = false;
					}
					await host.cleanup(temporaryPath);
				};
				try {
					await cleanup();
				} catch (cause) {
					cleanupFailure = `Hopper DMG cleanup failed: ${failureMessage(cause)}`;
					host.retainCleanup?.(cleanup, [temporaryPath]);
				}
			}
			const retainedCleanupFailure = [
				bundleCleanupFailure,
				cleanupFailure,
				result.cleanupFailure
			].filter((failure) => failure !== undefined).join(" ");
			return retainedCleanupFailure === "" ? result : {
				...result,
				cleanupFailure: retainedCleanupFailure
			};
		};
		installMacHopperBundle = async (source, destination, replaceExisting, operations, retainCleanup) => {
			const stagingRoot = await operations.createStagingRoot(posix.dirname(destination));
			const stagedBundle = posix.join(stagingRoot, "new.app");
			const previousBundle = posix.join(stagingRoot, "previous.app");
			let originalBackedUp = false;
			let newCommitted = false;
			let failureReason = "copy";
			try {
				await operations.copyBundle(source, stagedBundle);
				failureReason = "launcher_missing";
				await operations.requireLauncher(posix.join(stagedBundle, "Contents/MacOS/hopper"));
				failureReason = "copy";
				if (replaceExisting) {
					await operations.rename(destination, previousBundle);
					originalBackedUp = true;
				}
				await operations.rename(stagedBundle, destination);
				newCommitted = true;
			} catch (cause) {
				const diagnostics = [failureMessage(cause)];
				if (originalBackedUp && !newCommitted) {
					try {
						if (await operations.pathExists(destination)) throw new Error("destination now contains another installation; preserving the previous bundle in its owned staging root");
						await operations.rename(previousBundle, destination);
						originalBackedUp = false;
					} catch (rollbackCause) {
						diagnostics.push(`rollback failed: ${failureMessage(rollbackCause)}`);
						const cleanupFailure = `The previous Hopper bundle remains owned at ${previousBundle}; cleanup will retry restoration only if the destination is empty.`;
						retainCleanup(async () => {
							if (originalBackedUp) {
								if (await operations.pathExists(destination)) throw new Error(`Hopper destination is occupied; preserving owned backup ${previousBundle}`);
								await operations.rename(previousBundle, destination);
								originalBackedUp = false;
							}
							await operations.removeStagingRoot(stagingRoot);
						}, [stagingRoot]);
						return {
							status: "failed",
							reason: failureReason,
							diagnostic: diagnostics.join("; "),
							cleanupFailure
						};
					}
				}
				try {
					await operations.removeStagingRoot(stagingRoot);
				} catch (cleanupCause) {
					const cleanupFailure = `Hopper staging root cleanup failed: ${failureMessage(cleanupCause)}`;
					retainCleanup(() => operations.removeStagingRoot(stagingRoot), [stagingRoot]);
					diagnostics.push(cleanupFailure);
					return {
						status: "failed",
						reason: failureReason,
						diagnostic: diagnostics.join("; "),
						cleanupFailure
					};
				}
				return {
					status: "failed",
					reason: failureReason,
					diagnostic: diagnostics.join("; ")
				};
			}
			try {
				await operations.removeStagingRoot(stagingRoot);
				return { status: "installed" };
			} catch (cause) {
				const cleanupFailure = `Hopper staging root cleanup failed after installation committed: ${failureMessage(cause)}`;
				retainCleanup(() => operations.removeStagingRoot(stagingRoot), [stagingRoot]);
				return {
					status: "installed",
					cleanupFailure
				};
			}
		};
		systemMacHopperInstallHost = (homeDirectory, environment) => {
			const pendingCleanup = new Map();
			return {
				download: downloadHopperPackage,
				createTemporaryDirectory: () => mkdtemp(join(tmpdir(), "rea-hopper-mac-")),
				createMountDirectory: (path) => mkdir(path),
				writePackage: (path, bytes) => writeFile(path, bytes, { mode: 384 }),
				async mount(packagePath, mountPath) {
					await execFileAsync("hdiutil", [
						"attach",
						"-readonly",
						"-nobrowse",
						"-mountpoint",
						mountPath,
						packagePath
					], { env: environment });
					return true;
				},
				async unmount(mountPath) {
					await execFileAsync("hdiutil", [
						"detach",
						mountPath,
						"-force"
					], { env: environment });
				},
				async appBundle(mountPath) {
					const entries = await readdir(mountPath, { withFileTypes: true });
					const app = entries.find((entry) => entry.isDirectory() && /^Hopper.*\.app$/iu.test(entry.name));
					return app === undefined ? undefined : posix.join(mountPath, app.name);
				},
				async validBundle(appPath) {
					if (!await commandSucceeds("codesign", [
						"--verify",
						"--deep",
						"--strict",
						appPath
					], environment)) return "invalid_signature";
					if (!await commandSucceeds("codesign", [
						"--verify",
						"--strict",
						`-R${HOPPER_PUBLISHER_REQUIREMENT}`,
						appPath
					], environment)) return "unverified_publisher";
					return "verified";
				},
				async destinationExists(path) {
					try {
						await access(path);
						return true;
					} catch (cause) {
						if (isMissingPath(cause)) return false;
						throw cause;
					}
				},
				installBundle: (source, destination, replaceExisting) => installMacHopperBundle(source, destination, replaceExisting, {
					async createStagingRoot(parent) {
						await mkdir(parent, { recursive: true });
						return mkdtemp(posix.join(parent, ".rea-hopper-stage-"));
					},
					copyBundle: async (bundle, staged) => {
						await execFileAsync("ditto", [bundle, staged], { env: environment });
					},
					requireLauncher: (path) => access(path).then(() => undefined),
					pathExists,
					rename,
					removeStagingRoot: (path) => rm(path, { recursive: true })
				}, (cleanup, resources) => pendingCleanup.set(cleanup, resources)),
				async openApplication(path) {
					await execFileAsync("open", [path], { env: environment });
				},
				cleanup: (path) => rm(path, {
					recursive: true,
					force: true
				}),
				retainCleanup: (cleanup, resources) => pendingCleanup.set(cleanup, resources),
				async close() {
					const failures = [];
					for (const cleanup of pendingCleanup.keys()) {
						try {
							await cleanup();
							pendingCleanup.delete(cleanup);
						} catch (cause) {
							failures.push(failureMessage(cause));
						}
					}
					return failures.length === 0 ? undefined : {
						reason: `Hopper installer cleanup remains incomplete: ${failures.join("; ")}`,
						resources: [...new Set([...pendingCleanup.values()].flat())]
					};
				},
				destination: () => macHopperUserApplicationPath(homeDirectory)
			};
		};
		parseJson = (bytes) => JSON.parse(new TextDecoder().decode(bytes));
		integrityMatches = (bytes, release) => bytes.byteLength === Number(release.file_length) && bytes.byteLength <= 1e8 && createHash("sha1").update(bytes).digest("hex") === release.file_hash;
		commandSucceeds = async (command, args, environment) => {
			try {
				await execFileAsync(command, args, { env: environment });
				return true;
			} catch (cause) {
				if (typeof cause === "object" && cause !== null && "code" in cause && typeof cause.code === "number") return false;
				throw cause;
			}
		};
		failureMessage = (cause) => cause instanceof Error ? [cause.message, "stderr" in cause && typeof cause.stderr === "string" ? cause.stderr.trim() : ""].filter((value) => value !== "").join(": ") : String(cause);
		isMissingPath = (cause) => typeof cause === "object" && cause !== null && "code" in cause && cause.code === "ENOENT";
		pathExists = async (path) => {
			try {
				await access(path);
				return true;
			} catch (cause) {
				if (isMissingPath(cause)) return false;
				throw cause;
			}
		};
		releaseSchema = z.object({
			filename: z.string().url(),
			file_length: z.string().regex(/^\d+$/u),
			file_hash: z.string().regex(/^[a-f0-9]{40}$/u)
		});
		releasesSchema = z.object({ "OS X": releaseSchema });
	})))();
}

//#endregion
//#region dist/application/SetupRegistrationPrewarm.js
var PREWARM_TIMEOUT_MS, PREWARM_CAPTURE_LIMIT, PREWARM_REASON_LIMIT, registrationPrewarmCommand, materializeRegistrationRunnerCache, stopRunnerTree, launchRegistrationRunnerCommand, FORWARD_SIGNALS, boundedStream, prewarmFailureReason;
function init_SetupRegistrationPrewarm() {
	return (init_SetupRegistrationPrewarm = __esmMin((() => {
		init_ProcessOwnership();
		init_ClientRegistrationIdentity();
		PREWARM_TIMEOUT_MS = 18e4;
		PREWARM_CAPTURE_LIMIT = 64 * 1024;
		PREWARM_REASON_LIMIT = 300;
		registrationPrewarmCommand = (command) => {
			if (command.length === 0 || command[command.length - 1] !== "mcp" || inspectClientRegistrationCommand(command, undefined).package === undefined) return undefined;
			return [...command.slice(0, -1), "--version"];
		};
		materializeRegistrationRunnerCache = async (command, environment, launchCommand = launchRegistrationRunnerCommand) => {
			const prewarm = registrationPrewarmCommand(command);
			if (prewarm === undefined) return {
				status: "skipped",
				reason: "direct_launcher"
			};
			const launch = await launchCommand(prewarm[0] ?? "", prewarm.slice(1), {
				env: environment,
				cwd: tmpdir(),
				timeoutMs: PREWARM_TIMEOUT_MS,
				platform: process.platform
			});
			return launch.timedOut || launch.spawnError !== undefined || launch.interruptedSignal !== undefined || launch.exitCode !== 0 ? {
				status: "failed",
				reason: prewarmFailureReason(launch)
			} : { status: "warmed" };
		};
		stopRunnerTree = (child, platform) => {
			const pid = child.pid;
			if (pid === undefined) return Promise.resolve();
			if (platform === "win32") return cleanupWindowsProcessTree(pid).then(() => undefined);
			return new Promise((resolve) => {
				try {
					process.kill(-pid, "SIGKILL");
				} catch {}
				resolve();
			});
		};
		launchRegistrationRunnerCommand = (command, arguments_, options) => new Promise((resolve) => {
			const child = spawn(command, [...arguments_], {
				env: options.env,
				cwd: options.cwd,
				stdio: [
					"ignore",
					"pipe",
					"pipe"
				],
				...options.platform === "win32" ? {} : { detached: true }
			});
			const stdout = boundedStream(child.stdout);
			const stderr = boundedStream(child.stderr);
			let timedOut = false;
			let spawnError;
			let interruptedSignal;
			const timer = setTimeout(() => {
				timedOut = true;
				void stopRunnerTree(child, options.platform).finally(() => {
					child.kill("SIGKILL");
				});
			}, options.timeoutMs);
			const detachSignalForwarding = () => {
				for (const [signal, handler] of signalHandlers) process.removeListener(signal, handler);
			};
			const signalHandlers = new Map(FORWARD_SIGNALS.map((signal) => [signal, () => {
				if (interruptedSignal !== undefined) return;
				interruptedSignal = signal;
				clearTimeout(timer);
				void stopRunnerTree(child, options.platform).finally(() => {
					child.kill("SIGKILL");
					detachSignalForwarding();
					process.kill(process.pid, signal);
				});
			}]));
			for (const [signal, handler] of signalHandlers) process.on(signal, handler);
			child.on("error", (error) => {
				spawnError = error.message;
			});
			child.on("close", (code, signal) => {
				clearTimeout(timer);
				detachSignalForwarding();
				resolve({
					exitCode: code ?? signal,
					signal: signal ?? null,
					stdout: stdout(),
					stderr: stderr(),
					timedOut,
					...spawnError === undefined ? {} : { spawnError },
					...interruptedSignal === undefined ? {} : { interruptedSignal }
				});
			});
		});
		FORWARD_SIGNALS = ["SIGINT", "SIGTERM"];
		boundedStream = (stream) => {
			let captured = "";
			stream?.on("data", (chunk) => {
				if (captured.length < PREWARM_CAPTURE_LIMIT) captured += chunk.toString("utf8").slice(0, PREWARM_CAPTURE_LIMIT);
			});
			return () => captured;
		};
		prewarmFailureReason = (launch) => {
			const observed = launch.spawnError !== undefined ? launch.spawnError : launch.interruptedSignal !== undefined ? `the package runner was stopped by ${launch.interruptedSignal}` : launch.timedOut ? `the package runner timed out after the bounded prewarm window` : `exit ${launch.exitCode === null ? "unknown" : String(launch.exitCode)}${launch.stderr.trim() === "" ? "" : `: ${launch.stderr.trim()}`}`;
			const normalized = observed.replace(/\u001b(?:\[[0-9;?]*[ -/]*[@-~]|\([0-9A-Za-z]|[@-Z\\^_])/gu, "").replace(/[\u0000-\u001f\u007f]+/gu, " ").replace(/\s+/gu, " ").trim();
			return `The pinned package-runner entry could not be materialized before the first client start (${normalized.slice(0, PREWARM_REASON_LIMIT)}); the first client start will install it inside its startup deadline.`;
		};
	})))();
}

//#endregion
//#region dist/application/ClientConfigurationTransaction.js
var activeTransactions, withClientConfigurationTransaction;
function init_ClientConfigurationTransaction() {
	return (init_ClientConfigurationTransaction = __esmMin((() => {
		activeTransactions = new Map();
		withClientConfigurationTransaction = async (path, operation) => {
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
			} finally {
				release();
				if (activeTransactions.get(key) === current) activeTransactions.delete(key);
			}
		};
	})))();
}

//#endregion
//#region dist/application/SetupClientConfiguration.js
var ClientConfigurationCleanupRollbackFailure, configureClientConfiguration, configureClientDocument, persistClientConfiguration, clientConfigurationAligned, inspectClientConfiguration, inspectClientDocument, isMissing, throwCleanupFailure, readZcodeFallbackServers, restoreConfig, rollbackOrReadbackFailure, rollbackFailure, isConfigurationConflict, conflictFailure, errorDetail, registrationCurrent, clientConfigurationDesired;
function init_SetupClientConfiguration() {
	return (init_SetupClientConfiguration = __esmMin((() => {
		init_GeminiClientSettings();
		init_ClientConfigurationFiles();
		init_result();
		init_configurationErrors();
		init_ClientConfigurationDocument();
		init_DshCordisPatch();
		init_RegularFile();
		init_ClientConfigurationTransaction();
		init_ClientConfigurationCleanup();
		init_ClientConfigurationPublication();
		init_ClientRegistrationEnvironment();
		init_ClientRegistration();
		init_identity();
		init_snapshotEnvironment();
		init_ClientRegistrationIdentity();
		init_ClientConfigPath();
		init_MsixPackageStorage();
		init_OwnedRegularFile();
		init_RegularFileRead();
		init_SetupRecoveryBackup();
		init_SupportedClients();
		ClientConfigurationCleanupRollbackFailure = class extends RegularFileCleanupFailure {
			configurationFailure;
			constructor(failure, configurationFailure) {
				super({
					...failure,
					cleanupCause: new AggregateError([failure.cleanupCause, configurationFailure], `Configuration readback cleanup and rollback failed: ${failure.path}`)
				});
				this.configurationFailure = configurationFailure;
			}
		};
		configureClientConfiguration = async (client, environment = {}, command = npxRegistrationCommand(), resolveProviderRequestBudget) => {
			if (client.configPathError !== undefined) return {
				status: "failed",
				reason: "path"
			};
			const transactionPath = await resolveClientConfigTransactionPath(client.configPath);
			if (transactionPath === undefined) return {
				status: "failed",
				reason: "path"
			};
			try {
				return await withClientConfigurationTransaction(transactionPath, () => configureClientDocument({
					client,
					transactionPath
				}, environment, command, resolveProviderRequestBudget));
			} catch (cause) {
				if (cause instanceof ConfigurationError) return {
					status: "failed",
					reason: "readback"
				};
				throw cause;
			}
		};
		configureClientDocument = async ({ client, transactionPath }, environment, command, resolveProviderRequestBudget) => {
			const format = client.format;
			if (format === undefined || format === "unsupported") return {
				status: "failed",
				reason: "readback"
			};
			const files = await readClientConfigurationFiles(client);
			if (!files.ok) {
				throwCleanupFailure(files.error);
				return {
					status: "failed",
					reason: "readback"
				};
			}
			const existing = files.value.find(({ sourcePath }) => sourcePath === client.configPath);
			const editabilityError = existing?.dialect === "dsh" ? dshDocument(existing.document).editabilityError : undefined;
			if (editabilityError !== undefined) return {
				status: "failed",
				reason: "readback"
			};
			let snapshot;
			try {
				snapshot = await readRegularFileTextSnapshot(transactionPath, { symlinks: "reject" });
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure) throw cause;
				if (!isMissing(cause)) return {
					status: "failed",
					reason: "readback"
				};
			}
			const original = snapshot?.text;
			let parsed;
			try {
				parsed = parseClientConfiguration(original ?? (format === "toml" || format === "grok" || format === "dsh" ? "" : "{}"), format);
				parsed = clientConfigurationForWrite(parsed, files.value);
				const policy = await readClientPolicyBlock(client, parsed, await clientConfigurationDesired(client, environment, command, parsed, files.value, resolveProviderRequestBudget));
				if (!policy.ok) {
					throwCleanupFailure(policy.error);
					return {
						status: "failed",
						reason: "readback"
					};
				}
				if (policy.value !== undefined) return {
					status: "failed",
					reason: "readback"
				};
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure) throw cause;
				void cause;
				return {
					status: "failed",
					reason: "readback"
				};
			}
			const fallback = await readZcodeFallbackServers(client, parsed);
			if (!fallback.ok) {
				throwCleanupFailure(fallback.error);
				return {
					status: "failed",
					reason: "readback"
				};
			}
			const desired = await clientConfigurationDesired(client, environment, command, {
				...parsed,
				servers: {
					...fallback.value,
					...parsed.servers
				}
			}, files.value, resolveProviderRequestBudget);
			if (registrationCurrent(parsed, desired)) return { status: "unchanged" };
			return persistClientConfiguration({
				client,
				transactionPath,
				snapshot,
				format,
				original,
				parsed,
				desired,
				fallbackServers: fallback.value
			});
		};
		persistClientConfiguration = async ({ client, transactionPath, snapshot, format, original, parsed, desired, fallbackServers }) => {
			if (client.msixPackage !== undefined) {
				const target = await packageReadTargetChanged(client.msixPackage, client.configPath);
				if (!target.ok) return {
					status: "failed",
					reason: "target_unavailable",
					failure: {
						kind: "inspect",
						path: target.error.path,
						detail: target.error.detail
					}
				};
				if (target.value) return {
					status: "failed",
					reason: "target_changed"
				};
			}
			const legacyPath = legacyClientServerPath(parsed, PRODUCT_IDENTITY.mcpServerKey);
			const registered = withClientServers(parsed, {
				...fallbackServers,
				...parsed.servers,
				[PRODUCT_IDENTITY.mcpServerKey]: desired
			}, PRODUCT_IDENTITY.mcpServerKey);
			const ompDisabled = parsed.dialect === "omp" ? parsed.document[OMP_DISABLED_SERVERS_KEY] : undefined;
			const enableOmp = Array.isArray(ompDisabled) && ompDisabled.includes(PRODUCT_IDENTITY.mcpServerKey);
			const document = enableOmp && Array.isArray(ompDisabled) ? {
				...registered,
				[OMP_DISABLED_SERVERS_KEY]: ompDisabled.filter((name) => name !== PRODUCT_IDENTITY.mcpServerKey)
			} : registered;
			let serialized;
			try {
				serialized = serializeClientConfiguration(document, format, original, [
					...Object.keys(fallbackServers).filter((name) => name !== PRODUCT_IDENTITY.mcpServerKey).map((name) => clientServerPath(parsed, name)),
					clientServerPath(parsed, PRODUCT_IDENTITY.mcpServerKey),
					...legacyPath === undefined ? [] : [legacyPath],
					...enableOmp ? [[OMP_DISABLED_SERVERS_KEY]] : []
				], { removeShadowedMembersAt: legacyPath === undefined ? [] : [legacyPath] });
			} catch (cause) {
				return {
					status: "failed",
					reason: "write",
					failure: new ClientConfigurationWriteError(client.configPath, "serialize", cause).problem
				};
			}
			if (!serialized.ok) return {
				status: "failed",
				reason: "shadowed_member",
				path: serialized.error.path
			};
			let recoveryBackupPath;
			if (original !== undefined) {
				const preserved = await preserveCurrentRecoveryBackup(`${client.configPath}.rea.backup`, transactionPath, original);
				if (!preserved.ok) return {
					status: "failed",
					reason: "backup"
				};
				recoveryBackupPath = preserved.value;
			}
			let publication;
			try {
				await mkdir(dirname(client.configPath), { recursive: true });
				publication = await ClientConfigurationPublication.write(transactionPath, serialized.value, original, 384, {
					requestedPath: client.configPath,
					state: snapshot?.state
				});
			} catch (cause) {
				if (isClientConfigurationCleanupFailure(cause)) throw cause;
				if (isConfigurationConflict(cause)) return conflictFailure(recoveryBackupPath);
				return {
					status: "failed",
					reason: "write",
					failure: (cause instanceof ClientConfigurationWriteError ? cause : new ClientConfigurationWriteError(client.configPath, "publish", cause)).problem,
					...recoveryBackupPath === undefined ? {} : { backupPath: recoveryBackupPath }
				};
			}
			return publication.verify(async () => {
				try {
					const text = await readRegularFileText(publication.path);
					await publication.assertCurrent(text);
					const readback = parseClientConfiguration(text, format);
					if (!registrationCurrent(readback, desired) || Object.entries(fallbackServers).some(([name, entry]) => name !== PRODUCT_IDENTITY.mcpServerKey && !clientConfigurationValuesEqual(readback.servers[name], entry))) {
						return await rollbackOrReadbackFailure(publication, original, recoveryBackupPath);
					}
				} catch (cause) {
					if (isConfigurationConflict(cause) || isMissing(cause)) return conflictFailure(recoveryBackupPath);
					if (cause instanceof RegularFileCleanupFailure) {
						const rollback = await restoreConfig(publication, original);
						if (!rollback.ok) throw new ClientConfigurationCleanupRollbackFailure(cause, rollbackFailure(rollback.error, recoveryBackupPath));
						throw cause;
					}
					void cause;
					return rollbackOrReadbackFailure(publication, original, recoveryBackupPath);
				}
				return {
					status: "configured",
					...recoveryBackupPath === undefined ? {} : { backupPath: recoveryBackupPath }
				};
			});
		};
		clientConfigurationAligned = async (client, providerEnvironment, command, resolveProviderRequestBudget) => {
			if (client.configPathError !== undefined) return false;
			try {
				const files = await readClientConfigurationFiles(client);
				if (!files.ok) {
					throwCleanupFailure(files.error);
					return false;
				}
				const original = await readRegularFileText(client.configPath);
				const parsed = clientConfigurationForWrite(parseClientConfiguration(original, client.format), files.value);
				const desired = await clientConfigurationDesired(client, providerEnvironment, command, parsed, files.value, resolveProviderRequestBudget);
				const policy = await readClientPolicyBlock(client, parsed, desired);
				if (!policy.ok) {
					throwCleanupFailure(policy.error);
					return false;
				}
				return policy.value === undefined && registrationCurrent(parsed, desired);
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure) throw cause;
				void cause;
				return false;
			}
		};
		inspectClientConfiguration = async (client, providerEnvironment, command, resolveProviderRequestBudget) => {
			let inspection;
			try {
				inspection = await inspectClientDocument(client, providerEnvironment, command, resolveProviderRequestBudget);
			} catch (cause) {
				if (!(cause instanceof ConfigurationError)) throw cause;
				return {
					status: "invalid",
					remediation: `${cause.message}: ${cause.settings.map(({ setting, constraint }) => `${setting}: ${constraint}`).join("; ")}`
				};
			}
			if (inspection.status !== "create" && inspection.status !== "update") return inspection;
			const blocker = registrationWriteBlocker(client, "setup");
			return blocker === undefined ? inspection : {
				status: "invalid",
				remediation: blocker
			};
		};
		inspectClientDocument = async (client, providerEnvironment, command, resolveProviderRequestBudget) => {
			if (client.configPathError !== undefined) return {
				status: "invalid",
				remediation: client.configPathError
			};
			if (client.format === "unsupported") return { status: "already_current" };
			const files = await readClientConfigurationFiles(client);
			if (!files.ok) {
				throwCleanupFailure(files.error);
				return {
					status: "invalid",
					remediation: files.error.detail
				};
			}
			const existing = files.value.find(({ sourcePath }) => sourcePath === client.configPath);
			const editabilityError = existing?.dialect === "dsh" ? dshDocument(existing.document).editabilityError : undefined;
			if (editabilityError !== undefined) return {
				status: "invalid",
				remediation: editabilityError.message
			};
			const transactionPath = await resolveClientConfigTransactionPath(client.configPath);
			if (transactionPath === undefined) return {
				status: "invalid",
				remediation: "The configuration path is unsafe or unresolved. Check ownership and symbolic links before rerunning setup."
			};
			let original;
			try {
				original = await readRegularFileText(transactionPath);
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure) throw cause;
				if (isMissing(cause)) {
					const policy = await readClientPolicyBlock(client, undefined, await clientConfigurationDesired(client, providerEnvironment, command, undefined, files.value, resolveProviderRequestBudget));
					if (!policy.ok) {
						throwCleanupFailure(policy.error);
						return {
							status: "invalid",
							remediation: policy.error.detail
						};
					}
					if (policy.value !== undefined) return {
						status: "invalid",
						remediation: policy.value
					};
					const fallback = await readZcodeFallbackServers(client);
					if (!fallback.ok) {
						throwCleanupFailure(fallback.error);
						return {
							status: "invalid",
							remediation: fallback.error.detail
						};
					}
					return { status: "create" };
				}
				return {
					status: "invalid",
					remediation: `The configuration file could not be read. Check its permissions before rerunning setup. ${cause instanceof Error ? cause.message : String(cause)}`
				};
			}
			try {
				const parsed = clientConfigurationForWrite(parseClientConfiguration(original, client.format), files.value);
				const desired = await clientConfigurationDesired(client, providerEnvironment, command, parsed, files.value, resolveProviderRequestBudget);
				const policy = await readClientPolicyBlock(client, parsed, desired);
				if (!policy.ok) {
					throwCleanupFailure(policy.error);
					return {
						status: "invalid",
						remediation: policy.error.detail
					};
				}
				if (policy.value !== undefined) return {
					status: "invalid",
					remediation: policy.value
				};
				if (registrationCurrent(parsed, desired)) return { status: "already_current" };
				const fallback = await readZcodeFallbackServers(client, parsed);
				if (!fallback.ok) {
					throwCleanupFailure(fallback.error);
					return {
						status: "invalid",
						remediation: fallback.error.detail
					};
				}
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure || cause instanceof ConfigurationError) throw cause;
				void cause;
				return {
					status: "invalid",
					remediation: "The existing configuration is malformed. Repair it before setup applies any other changes."
				};
			}
			const backupSelection = await selectCurrentRecoveryBackup(`${client.configPath}.rea.backup`, original);
			if (!backupSelection.ok) return {
				status: "invalid",
				remediation: backupSelection.error.detail
			};
			return {
				status: "update",
				backupPath: backupSelection.value.backupPath
			};
		};
		isMissing = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
		throwCleanupFailure = (error) => {
			if (error.cleanupFailure !== undefined) throw error.cleanupFailure;
		};
		readZcodeFallbackServers = async (client, parsed) => {
			if (client.format !== "zcode" || parsed !== undefined && Object.keys(parsed.servers).length > 0) return ok({});
			const path = client.zcodeFallbackPath;
			const detail = `The ZCode fallback configuration ${path ?? "path"} is unresolved, malformed or unreadable. Repair it before rerunning setup: the first native server would suppress that fallback.`;
			if (path === undefined) return err({
				kind: "unreadable",
				path: client.configPath,
				detail
			});
			const transactionPath = await resolveClientConfigTransactionPath(path);
			if (transactionPath === undefined) return err({
				kind: "unreadable",
				path,
				detail
			});
			const source = await readConfigurationText(transactionPath);
			if (!source.ok) return err({
				...source.error,
				detail: `${detail} ${source.error.detail}`
			});
			if (source.value === undefined) return ok({});
			try {
				const parsed = parseZcodeFallbackConfiguration(source.value);
				const environment = clientRegistrationEnvironment(parsed);
				if (!environment.ok) return err({
					kind: "malformed",
					path,
					detail: `${detail} ${environment.error.settings.map(({ setting, constraint }) => `${setting}: ${constraint}`).join("; ")}`
				});
				return ok(parsed.servers);
			} catch (cause) {
				return err({
					kind: "malformed",
					path,
					detail: `${detail} ${cause instanceof Error ? cause.message : String(cause)}`
				});
			}
		};
		restoreConfig = async (publication, original) => {
			try {
				await publication.restore(original);
				return ok(undefined);
			} catch (cause) {
				if (isConfigurationConflict(cause) || isMissing(cause)) return err({ kind: "conflict" });
				return err({
					kind: "restore",
					path: publication.path,
					detail: errorDetail(cause)
				});
			}
		};
		rollbackOrReadbackFailure = async (publication, original, backupPath) => {
			const rollback = await restoreConfig(publication, original);
			return rollback.ok ? {
				status: "failed",
				reason: "readback",
				...backupPath === undefined ? {} : { backupPath }
			} : rollbackFailure(rollback.error, backupPath);
		};
		rollbackFailure = (failure, backupPath) => failure.kind === "conflict" ? conflictFailure(backupPath) : {
			status: "failed",
			reason: "rollback",
			failure,
			...backupPath === undefined ? {} : { backupPath }
		};
		isConfigurationConflict = (cause) => cause instanceof RegularFileChangedError || cause instanceof InvalidUtf8FileError;
		conflictFailure = (backupPath) => ({
			status: "failed",
			reason: "conflict",
			...backupPath === undefined ? {} : { backupPath }
		});
		errorDetail = (cause) => cause instanceof Error ? cause.message : String(cause);
		registrationCurrent = (parsed, desired) => (parsed.dialect !== "dsh" || dshDocument(parsed.document).ready) && clientConfigurationValuesEqual(parsed.servers[PRODUCT_IDENTITY.mcpServerKey], desired) && !Object.hasOwn(parsed.legacyServers, PRODUCT_IDENTITY.mcpServerKey) && !clientServerListedDisabled(parsed, PRODUCT_IDENTITY.mcpServerKey);
		clientConfigurationDesired = async (client, providerEnvironment, command, parsed, sources, resolveProviderRequestBudget) => {
			const effective = effectiveClientConfiguration(sources, {
				client,
				document: parsed
			});
			const format = clientWriteDialect(parsed?.dialect ?? client.format ?? "json", sources);
			const launcher = command.length === 0 ? [PRODUCT_IDENTITY.cliBinary, "mcp"] : command;
			if (format === "dsh") {
				const validated = clientRegistrationEnvironment(effective, providerEnvironment);
				if (!validated.ok) throw validated.error;
				const desired = (parsed === undefined ? new DshCordisDocument("") : dshDocument(parsed.document)).desired(launcher, providerEnvironment);
				if (!desired.ok) throw desired.error;
				return desired.value;
			}
			const validated = await clientRegistrationEnvironmentDetailsWithBudget(effective, providerEnvironment, "effective", client.name === "codex" || client.name === "kimi" ? resolveProviderRequestBudget : undefined);
			if (!validated.ok) throw validated.error;
			const environment = clientRegistrationEnvironment(parsed, providerEnvironment, "fragment");
			if (!environment.ok) throw environment.error;
			const registrationEnvironment = client.name === "kimi" && snapshotEnvironment(environment.value).REA_MCP_INPUT_SCHEMA_PROFILE === undefined ? {
				...environment.value,
				REA_MCP_INPUT_SCHEMA_PROFILE: "compact"
			} : environment.value;
			const registration = refreshClientRegistration(client, format, launcher, registrationEnvironment, parsed === undefined ? undefined : effectiveClientServer(parsed, PRODUCT_IDENTITY.mcpServerKey), validated.value.timeoutInputs);
			if (!registration.ok) throw registration.error;
			return registration.value;
		};
	})))();
}

//#endregion
//#region dist/application/SetupInstallFailure.js
var normalizePackageOutput, packageOutputExcerpt, packageManagerRemediation, setupInstallFailure;
function init_SetupInstallFailure() {
	return (init_SetupInstallFailure = __esmMin((() => {
		init_hopperPublisher();
		init_HopperReleaseFeed();
		normalizePackageOutput = (output) => output.replace(/\u001b(?:\[[0-9;?]*[ -/]*[@-~]|\([0-9A-Za-z]|[@-Z\\^_])/gu, "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu, "").replace(/\s+/gu, " ").trim();
		packageOutputExcerpt = (failure, limit = 400) => {
			const output = [failure.stderr, failure.stdout].map(normalizePackageOutput).filter((text) => text !== "").join(" ");
			const suffix = failure.outputTruncated ? " (output truncated)" : "";
			const bodyLimit = limit - suffix.length;
			if (output.length <= bodyLimit) return `${output}${suffix}`;
			const half = Math.floor((bodyLimit - 3) / 2);
			const head = output.slice(0, half).replace(/\s+\S*$/u, "").trimEnd();
			const tail = output.slice(-half).replace(/^\S*\s+/u, "").trimStart();
			return `${head} … ${tail}${suffix}`;
		};
		packageManagerRemediation = (failure) => {
			if (failure === undefined) return "Allow the system package-manager operation or install the planned Hopper package and Linux runtime dependencies, then rerun rea setup.";
			const status = failure.exitCode === null ? "no exit status" : `exit ${failure.exitCode}`;
			const excerpt = packageOutputExcerpt(failure);
			const observed = excerpt === "" ? "no output was captured." : `its output: ${excerpt}`;
			return `The system package-manager command failed (${failure.command}; ${status}); ${observed} Resolve the reported problem, grant the authorization the command needs, or install the planned Hopper package and Linux runtime dependencies manually, then rerun rea setup.`;
		};
		setupInstallFailure = (reason, packageFailure, platform = "darwin") => {
			switch (reason) {
				case "unsupported_host": return {
					status: "failed",
					code: "unsupported_host",
					remediation: "Use a supported host, then rerun rea setup."
				};
				case "integrity": return {
					status: "failed",
					code: "integrity_mismatch",
					remediation: "The Hopper download failed integrity verification. Retry setup; if it repeats, update REA before installing."
				};
				case "authorization_or_package_manager": return {
					status: "failed",
					code: "authorization_or_package_manager_failed",
					remediation: packageManagerRemediation(packageFailure)
				};
				case "launcher_missing": return {
					status: "failed",
					code: "launcher_missing",
					remediation: "The package operation completed but Hopper is not runnable. Run rea doctor and repair the reported launcher issue."
				};
				case "runtime_dependencies": return {
					status: "failed",
					code: "runtime_dependency_unavailable",
					remediation: "Hopper's required runtime could not be verified. Inspect rea doctor --provider hopper; on a supported system use rea setup --install-hopper to repair its dependencies."
				};
				case "unsupported_hopper_build": return {
					status: "failed",
					code: "unsupported_hopper_build",
					remediation: "The installed Hopper launcher does not match the authenticated vendor package. Check HOPPER_LAUNCHER_PATH and reinstall the official Hopper demo through rea setup."
				};
				case "cancelled": return {
					status: "failed",
					code: "setup_cancelled",
					remediation: "Setup was cancelled. Run rea doctor to inspect the current state before retrying."
				};
				case "destination_inspection": return {
					status: "failed",
					code: "destination_inspection_failed",
					remediation: "REA could not inspect the Hopper installation destination. Check access to the reported path before retrying; an existing installation has not been established."
				};
				case "archive_write": return {
					status: "failed",
					code: "archive_write_failed",
					remediation: "The Hopper download completed, but REA could not stage its local archive. Check the reported path, permissions and free space, then retry setup."
				};
				case "launcher_inspection": return {
					status: "failed",
					code: "launcher_inspection_failed",
					remediation: "REA could not verify the installed Hopper launcher. Repair the reported inspection failure before retrying; launcher absence has not been established."
				};
				case "destination_exists": return {
					status: "failed",
					code: "destination_exists",
					remediation: "The Hopper installation destination already exists and was not replaced. Reuse the existing installation or move it aside, then rerun rea setup."
				};
				case "mount": return {
					status: "failed",
					code: "mount_failed",
					remediation: "The verified Hopper disk image could not be mounted. Eject any stale Hopper image, check local disk access, then rerun rea setup."
				};
				case "bundle": return {
					status: "failed",
					code: "bundle_invalid",
					remediation: "The mounted package did not contain the expected Hopper application bundle. Retry setup; if it repeats, update REA before installing."
				};
				case "publisher_verification_failed": return {
					status: "failed",
					code: "publisher_verification_failed",
					remediation: platform === "linux" ? `The Hopper package signature did not verify under the pinned primary PGP fingerprint ${HOPPER_LINUX_PRIMARY_FINGERPRINT}; the package manager was not run. Download the official package and retry setup.` : `The mounted Hopper application is not signed by the publisher REA pins (${HOPPER_PUBLISHER.bundleIdentifier}, Apple team ${HOPPER_PUBLISHER.teamIdentifier}); nothing was copied or launched. Install Hopper yourself and set HOPPER_LAUNCHER_PATH to its launcher, then rerun rea setup.`
				};
				case "verification_unavailable": return {
					status: "failed",
					code: "publisher_verification_failed",
					remediation: "REA could not authenticate or retain the signed Hopper package. Check vendor access, native package inspection tools and caller-owned cache permissions, then retry setup."
				};
				case "cleanup_failed": return {
					status: "failed",
					code: "cleanup_failed",
					remediation: "Hopper publisher verification retained temporary cleanup ownership. Retry cleanup before running setup again."
				};
				case "copy": return {
					status: "failed",
					code: "copy_failed",
					remediation: "The verified Hopper application could not be copied to the installation destination. Check destination permissions and free space, then rerun rea setup."
				};
				default: return {
					status: "failed",
					code: "download_failed",
					remediation: "REA could not download or unpack the official Hopper package. Check network and filesystem access, then retry setup."
				};
			}
		};
	})))();
}

//#endregion
//#region dist/application/SetupRegistrationEnvironment.js
var SELECTED_REGISTRATION_SETTINGS, explicitSetupRegistrationEnvironment, providerRegistrationEnvironment;
function init_SetupRegistrationEnvironment() {
	return (init_SetupRegistrationEnvironment = __esmMin((() => {
		init_unicodeCodePointOrder();
		SELECTED_REGISTRATION_SETTINGS = [
			"REA_ANALYSIS_PROVIDER",
			"REA_ASAR_MAX_HEADER_BYTES",
			"REA_BRIDGE_MAX_REQUEST_BYTES",
			"REA_CAPTURE_DECODER_OLD_GENERATION_MIB",
			"REA_GHIDRA_DECOMPILE_TIMEOUT_SECONDS",
			"REA_GHIDRA_STARTUP_TIMEOUT_MS",
			"REA_HOPPER_STARTUP_TIMEOUT_MS",
			"REA_JEB_MCP_TIMEOUT_MS",
			"REA_MCP_INPUT_SCHEMA_PROFILE",
			"REA_REGEX_MATCHING_DEADLINE_MS",
			"REA_REGEX_WORKER_HEAP_REQUEST_MIB",
			"REA_MCP_INITIALIZE_BUDGET_MS",
			"REA_MCP_TOOLS_LIST_BUDGET_MS",
			"REA_MCP_FIRST_CATALOG_BUDGET_MS",
			"REA_MCP_DOCTOR_DEADLINE_MS"
		];
		explicitSetupRegistrationEnvironment = (environment) => Object.fromEntries(SELECTED_REGISTRATION_SETTINGS.flatMap((key) => {
			const value = environment[key];
			return value === undefined ? [] : [[key, value]];
		}));
		providerRegistrationEnvironment = (inspections) => Object.fromEntries(inspections.flatMap(({ registrationEnvironment }) => Object.entries(registrationEnvironment)).sort(([left], [right]) => compareUnicodeCodePoints(left, right)));
	})))();
}

//#endregion
//#region dist/application/SetupCleanupOwner.js
var setupCleanupReport, setupCleanupError, setupCleanupReason, SetupCleanupChild, SetupCleanupOwner;
function init_SetupCleanupOwner() {
	return (init_SetupCleanupOwner = __esmMin((() => {
		init_AnalysisCleanupLease();
		init_ArtifactReader();
		init_analysisErrorBase();
		init_providerCleanupError();
		init_RegularFileRead();
		setupCleanupReport = (cause, observation) => new ProviderCleanupError("setup", observation.resources, { reason: observation.reason }, {
			cause,
			cleanup: observation,
			operation: "setup"
		});
		setupCleanupError = (cause, observation = ArtifactReaderFailure.cleanupObservation(cause, [])) => {
			if (cause instanceof AnalysisError && (cause.cleanupIncomplete || cause.hasCleanupOwner || cause.cleanup !== undefined || cause instanceof ProviderCleanupError)) return cause;
			const error = setupCleanupReport(cause, observation);
			bindRegularFileCleanup(cause, error);
			return error;
		};
		setupCleanupReason = (error) => error.cleanup?.reason ?? (typeof error.diagnostics?.reason === "string" ? error.diagnostics.reason : error.message);
		SetupCleanupChild = class {
			task;
			#generation = {};
			#attempted;
			#completed;
			#failure;
			#reportedErrors = new WeakSet();
			#delegated;
			#reason = "";
			#resources = [];
			#attempt = Promise.resolve();
			#lease = this.#newLease();
			constructor(task) {
				this.task = task;
			}
			admit() {
				this.#generation = {};
			}
			get hasNewGeneration() {
				return this.#attempted !== this.#generation;
			}
			get failure() {
				if (this.#failure !== undefined && !this.#failure.owner.cleanupIncomplete) {
					this.#completed = this.#attempted;
					this.#failure = undefined;
					this.#reportedErrors = new WeakSet();
				}
				return this.#failure === undefined ? undefined : {
					...this.#failure,
					reason: this.#reason
				};
			}
			close() {
				void this.failure;
				if (this.#completed === this.#generation) return Promise.resolve();
				if (this.#lease.released || this.#completed !== undefined) {
					this.#lease = this.#newLease();
					this.#completed = undefined;
					this.#delegated = undefined;
				}
				const generation = this.#generation;
				this.#attempted = generation;
				try {
					this.#attempt = this.task.close();
				} catch (cause) {
					this.#attempt = Promise.reject(cause);
				}
				return this.#lease.release().then(() => {
					this.#completed = generation;
				});
			}
			#newLease() {
				return new AnalysisCleanupLease(() => this.#execute(), this);
			}
			get cleanupResources() {
				return this.#resources;
			}
			async #execute() {
				let failure;
				try {
					const report = await this.#attempt;
					if (report === undefined) return;
					failure = report instanceof AnalysisError ? setupCleanupError(report) : setupCleanupError(undefined, typeof report === "string" ? {
						reason: report,
						resources: []
					} : report);
					this.#reason = setupCleanupReason(failure);
				} catch (cause) {
					failure = setupCleanupError(cause);
					this.#reason = (this.task.rejectedPrefix === undefined ? "" : this.task.rejectedPrefix + ": ") + setupCleanupReason(failure);
				}
				if (this.#failure !== undefined) this.#failure.cause = failure;
				let dependency = failure;
				if (failure.cleanupIncomplete && !failure.hasCleanupOwner) {
					this.#resources = [...failure.cleanupResources];
					if (this.#delegated === undefined) {
						this.#delegated = setupCleanupReport(failure, {
							reason: this.#reason,
							resources: this.#resources
						});
						new AnalysisCleanupLeaseGroup(this.#delegated, [this.#lease]);
					}
					dependency = this.#delegated;
				}
				if (dependency !== undefined && dependency.cleanupIncomplete) {
					if (!this.#reportedErrors.has(dependency)) {
						if (this.#failure === undefined || !this.#failure.owner.cleanupIncomplete) {
							this.#failure = {
								owner: setupCleanupReport(new AggregateError([dependency], "Setup child cleanup authorities"), {
									reason: this.#reason,
									resources: []
								}),
								cause: failure
							};
							this.#reportedErrors = new WeakSet();
						} else this.#failure.owner.retainSecondaryFailure(dependency);
						this.#failure.owner.bindCleanupDependencies([dependency]);
						this.#reportedErrors.add(dependency);
					}
				}
				if (failure.cleanupIncomplete) throw failure;
				if (this.#delegated?.cleanupIncomplete) throw this.#delegated;
			}
		};
		SetupCleanupOwner = class {
			#children;
			#closing;
			constructor(tasks) {
				this.#children = new Map(tasks.map((task) => [task, new SetupCleanupChild(task)]));
			}
			/** Admit actual new cleanup work, never merely another retry of a failed peer. */
			admit(task) {
				const child = this.#children.get(task);
				if (child === undefined) throw new TypeError("Cleanup task is not owned by this setup host");
				child.admit();
			}
			close() {
				if (this.#closing !== undefined) return this.#closing;
				const attempt = this.#attempt().finally(() => {
					if (this.#closing === attempt) this.#closing = undefined;
				});
				this.#closing = attempt;
				return attempt;
			}
			async #attempt() {
				const children = [...this.#children.values()];
				do {
					await Promise.allSettled(children.map((child) => child.close()));
				} while (children.some((child) => child.hasNewGeneration));
				const failures = children.flatMap((child) => {
					const failure = child.failure;
					return failure === undefined ? [] : [failure];
				});
				if (failures.length === 0) return undefined;
				const observation = {
					reason: failures.map((failure) => failure.reason).join("; "),
					resources: [...new Set(failures.flatMap((failure) => failure.owner.cleanupResources))]
				};
				const error = setupCleanupReport(new AggregateError(failures.map((failure) => failure.cause), "Setup child cleanup failures", { cause: new AggregateError(failures.map((failure) => failure.owner), "Setup cleanup ownership reports") }), observation).bindCleanupDependencies(failures.map((failure) => failure.owner));
				return error.cleanupIncomplete ? error : undefined;
			}
		};
	})))();
}

//#endregion
//#region dist/application/SetupHost.js
var SetupHost_exports = /* @__PURE__ */ __exportAll({
	detectClients: () => detectClients,
	filterClientsNeedingConfigure: () => filterClientsNeedingConfigure,
	hostRemediation: () => hostRemediation,
	setupRegistrationCommand: () => setupRegistrationCommand,
	systemSetupHost: () => systemSetupHost
});
var setupRegistrationCommand, setupRegistration, filterClientsNeedingConfigure, hostRemediation, systemSetupHost, setupInstallerDiagnostic, clientConfigurationOperations, runClientConfigurationOperation, configurationCleanupError, errorMessage, detectClients, clientEvidencePresent, exists;
function init_SetupHost() {
	return (init_SetupHost = __esmMin((() => {
		init_ClientConfigurationCleanup();
		init_ArtifactResourceScope();
		init_ArtifactReader();
		init_configurationErrors();
		init_identity();
		init_ClientRegistrationIdentity();
		init_SetupRegistrationPrewarm();
		init_runtimeVersion();
		init_Doctor();
		init_LinuxHopper();
		init_MacHopper();
		init_LinuxHopperCacheDirectory();
		init_SupportedClients();
		init_SetupSkill();
		init_SetupClientConfiguration();
		init_SetupClients();
		init_SetupInstallFailure();
		init_OwnedRegularFile();
		init_SetupRegistrationEnvironment();
		init_MsixPackageStorage();
		init_SetupCleanupOwner();
		init_AnalysisCleanupLease();
		init_RegularFileRead();
		init_CurrentEntrypointPath();
		init_providerSelection();
		setupRegistrationCommand = (platform, packageRunner, entrypointPath, environment = {}) => {
			if (packageRunner !== undefined) return packageRunnerRegistrationCommand(packageRunner, platform);
			if (entrypointPath === undefined || entrypointPath.length === 0) return [];
			return platform === "win32" ? [
				process.execPath,
				entrypointPath,
				"mcp"
			] : [registrationEntrypointPath(entrypointPath, environment, platform), "mcp"];
		};
		setupRegistration = (platform, homeDirectory, environment) => {
			const registrationCommand = setupRegistrationCommand(platform, invokingPackageRunner(environment, platform), CURRENT_ENTRYPOINT_PATH, environment);
			const registrationCommandBlocker = registrationCommand.length === 0 ? "REA could not determine the current executable entrypoint. Run setup through the installed REA CLI or a supported package runner before configuring clients." : platform === "win32" ? packagePrivateLauncherBlocker(registrationCommand, msixPackagesDirectory(homeDirectory, environment)) : undefined;
			return registrationCommandBlocker === undefined ? { registrationCommand } : {
				registrationCommand,
				registrationCommandBlocker
			};
		};
		filterClientsNeedingConfigure = async (host, detectedClients, providerEnvironment, command) => {
			const needs = await Promise.all(detectedClients.map((client) => host.clientNeedsConfigure(client, providerEnvironment, command)));
			return detectedClients.filter((_, index) => needs[index]);
		};
		hostRemediation = (host) => supportsNodeVersion(host.nodeVersion) ? undefined : `Install ${SUPPORTED_NODE_VERSION_PROSE} and rerun setup.`;
		systemSetupHost = (selectedDoctorHost = undefined, environment = process.env) => {
			const doctorHost = selectedDoctorHost ?? systemDoctorHost({ environment });
			const platform = doctorHost.platform;
			const { homeDirectory } = doctorHost;
			const macHopperHost = platform === "darwin" ? systemMacHopperInstallHost(homeDirectory, environment) : undefined;
			const resources = new ArtifactResourceScope();
			const linuxDistribution = () => doctorHost.linuxDistribution();
			const linuxHopperHost = systemLinuxHopperInstallHost(environment, linuxDistribution);
			const pendingLinuxHopperCleanup = new LinuxHopperTemporaryCleanupOwner();
			const macCleanup = {
				rejectedPrefix: "Hopper host cleanup failed",
				close: async () => macHopperHost?.close?.()
			};
			const temporaryCleanup = {
				rejectedPrefix: "Linux Hopper cleanup retry failed",
				close: () => pendingLinuxHopperCleanup.retry(linuxHopperHost.cleanup)
			};
			const publisherCleanup = {
				rejectedPrefix: "Linux Hopper publisher cleanup failed",
				close: async () => {
					await linuxHopperHost.close?.();
				}
			};
			const registration = setupRegistration(platform, homeDirectory, environment);
			const prewarmRegistrationRunner = () => materializeRegistrationRunnerCache(registration.registrationCommand, environment);
			const cleanup = new SetupCleanupOwner([
				macCleanup,
				{
					rejectedPrefix: "Doctor host cleanup failed",
					close: async () => doctorHost.close?.()
				},
				temporaryCleanup,
				publisherCleanup,
				{ close: () => resources.close() }
			]);
			return {
				platform,
				homeDirectory,
				...platform === "linux" ? { linuxHopperReleaseCache: linuxHopperReleaseCacheDirectory(environment) } : {},
				skillDestinations: (clientIds) => skillDestinations(homeDirectory, clientIds, environment, platform),
				...registration,
				prewarmRegistrationRunner,
				nodeVersion: process.versions.node,
				macosVersion: () => doctorHost.macosVersion(),
				linuxDistribution,
				close: () => cleanup.close(),
				initialSetupState: async (scope) => {
					const diagnosis = await runDoctor(undefined, doctorHost, scope);
					const providerEnvironment = {
						...providerRegistrationEnvironment(diagnosis.providerInspections ?? []),
						...doctorHost.providerRegistrationEnvironment?.(),
						...explicitSetupRegistrationEnvironment(environment),
						...diagnosis.hopperPath === undefined ? {} : { HOPPER_LAUNCHER_PATH: diagnosis.hopperPath }
					};
					const requestedProvider = analysisProviderSelectorSchema.safeParse(environment.REA_ANALYSIS_PROVIDER);
					return {
						...diagnosis.hopperPath === undefined ? {} : { hopperPath: diagnosis.hopperPath },
						...typeof environment.HOPPER_LAUNCHER_PATH === "string" && environment.HOPPER_LAUNCHER_PATH.trim() !== "" && diagnosis.hopperPath === environment.HOPPER_LAUNCHER_PATH ? { hopperLauncherConfigured: true } : {},
						providerConfigured: diagnosis.hopperPath !== undefined || diagnosis.providerInspections?.some(({ configured }) => configured) === true || providerEnvironment.REA_JEB_MCP_URL !== undefined || requestedProvider.success && requestedProvider.data !== "auto",
						providerEnvironment,
						doctor: diagnosis
					};
				},
				installHopper: (replaceExisting) => resources.run(async () => {
					const publisher = platform === "linux" ? publisherCleanup : macCleanup;
					cleanup.admit(publisher);
					try {
						if (platform === "linux") {
							const result = await installLinuxHopper(linuxHopperHost);
							if (result.cleanupFailure !== undefined) {
								pendingLinuxHopperCleanup.retain(result.cleanupFailure);
								cleanup.admit(temporaryCleanup);
							}
							if (result.status === "installed") return {
								status: "installed",
								launcherPath: result.launcherPath
							};
							const failure = setupInstallFailure(result.reason, result.packageFailure, "linux");
							const detail = result.verificationFailure?.message ?? result.pythonRuntimeFailure?.message ?? (result.operationFailure === undefined ? undefined : `${result.operationFailure.operation}${result.operationFailure.path === undefined ? "" : ` at ${result.operationFailure.path}`}: ${result.operationFailure.systemCode === undefined ? "" : `${result.operationFailure.systemCode}: `}${result.operationFailure.detail}`);
							return detail !== undefined ? {
								...failure,
								remediation: `${detail} ${failure.remediation}`
							} : failure;
						}
						if (macHopperHost === undefined) return setupInstallFailure("unsupported_host");
						const result = await installMacHopper({ replaceExisting }, macHopperHost);
						if (result.status === "installed") return {
							status: "installed",
							launcherPath: result.launcherPath,
							...result.openFailure === undefined ? {} : { warning: `Hopper was installed, but macOS could not open it: ${result.openFailure}. Open ${result.launcherPath} manually to complete first-run setup.` },
							...result.cleanupFailure === undefined ? {} : { cleanupFailure: result.cleanupFailure }
						};
						const failure = setupInstallFailure(result.reason);
						const diagnostic = setupInstallerDiagnostic(result.diagnostic);
						return {
							...failure,
							remediation: [
								failure.remediation,
								...diagnostic === undefined ? [] : [`Installer detail: ${diagnostic}`],
								...result.cleanupFailure === undefined ? [] : [result.cleanupFailure]
							].join(" ")
						};
					} finally {
						cleanup.admit(publisher);
					}
				}),
				detectedClients: () => detectClients(homeDirectory, platform, environment),
				supportedClients: () => Promise.resolve(supportedClients(homeDirectory, platform, environment)),
				...clientConfigurationOperations(resources, doctorHost.resolveProviderRequestBudget),
				skillNeedsInstall: (clientIds) => canonicalSkillNeedsInstall(homeDirectory, clientIds, environment, platform, resources),
				validateSkillDirectories: (clientIds) => validateCanonicalSkillDirectories(homeDirectory, clientIds, environment, platform),
				installSkill: (clientIds) => installCanonicalSkill(homeDirectory, clientIds, environment, platform, undefined, resources),
				doctor: (scope) => runDoctor(undefined, doctorHost, scope)
			};
		};
		setupInstallerDiagnostic = (value) => {
			if (value === undefined) return undefined;
			const normalized = value.replace(/\u001b(?:\[[0-9;?]*[ -/]*[@-~]|\([0-9A-Za-z]|[@-Z\\^_])/gu, "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu, "").replace(/\s+/gu, " ").trim();
			if (normalized === "") return undefined;
			return normalized.length <= 400 ? normalized : `${normalized.slice(0, 397).trimEnd()}...`;
		};
		clientConfigurationOperations = (resources, resolveProviderRequestBudget) => ({
			configureClient: (client, providerEnvironment, command) => runClientConfigurationOperation(resources, async () => client.format === "unsupported" ? { status: "skipped" } : configureClientConfiguration(client, providerEnvironment, command, resolveProviderRequestBudget)),
			clientNeedsConfigure: (client, providerEnvironment, command) => runClientConfigurationOperation(resources, async () => client.format === "unsupported" ? false : !await clientConfigurationAligned(client, providerEnvironment, command, resolveProviderRequestBudget)),
			inspectClientConfiguration: (client, providerEnvironment, command) => runClientConfigurationOperation(resources, () => inspectClientConfiguration(client, providerEnvironment, command, resolveProviderRequestBudget))
		});
		runClientConfigurationOperation = async (resources, operation) => {
			try {
				return await resources.run(async () => {
					try {
						return await operation();
					} catch (cause) {
						if (!isClientConfigurationCleanupFailure(cause)) throw cause;
						const cleanup = await retryClientConfigurationCleanup(cause, resources);
						const rollback = cleanup.failures.find((failure) => failure instanceof ClientConfigurationCleanupRollbackFailure);
						const rollbackMessage = rollback instanceof ClientConfigurationCleanupRollbackFailure ? ` ${failedConfigurationMessage(rollback.configurationFailure)}` : "";
						throw configurationCleanupError(`Could not safely access client configuration at ${cause.path}: ${errorMessage(cleanup.primary)}.${rollbackMessage}`, cause, cleanup.cleanup, cleanup.cleanupLeases);
					}
				});
			} catch (cause) {
				if (cause instanceof ArtifactReaderFailure) throw configurationCleanupError(cause.message, cause, cause.cleanup);
				throw cause;
			}
		};
		configurationCleanupError = (message, cause, cleanup, leases) => {
			const error = new ConfigurationError(message, {
				cause,
				settings: [{
					setting: "client configuration",
					constraint: message
				}],
				...cleanup === undefined ? {} : { cleanup }
			});
			if (leases !== undefined) new AnalysisCleanupLeaseGroup(error, leases);
			else bindRegularFileCleanup(cause, error);
			return error;
		};
		errorMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
		detectClients = async (home, platform = process.platform, environment = process.env) => {
			const detected = [];
			for (const candidate of supportedClients(home, platform, environment)) {
				if (candidate.configPathError !== undefined) continue;
				if (await clientEvidencePresent(candidate)) detected.push(candidate);
			}
			return detected;
		};
		clientEvidencePresent = async (client) => {
			for (const path of clientEvidencePaths(client)) if (await exists(path)) return true;
			return false;
		};
		exists = async (path) => {
			try {
				await access(path);
				return true;
			} catch (cause) {
				void cause;
				return false;
			}
		};
	})))();
}

//#endregion
export { SetupHost_exports, configureDetectedClients, filterClientsNeedingConfigure, hostRemediation, init_MacHopper, init_SetupCleanupOwner, init_SetupClients, init_SetupHost, macHopperInstallDisclosure, setupCleanupError, setupCleanupReason, systemSetupHost };
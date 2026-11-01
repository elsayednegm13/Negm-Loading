import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { PRODUCT_IDENTITY, init_identity } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { ConfigurationError, err, init_configurationErrors, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { RegularFileCleanupFailure, init_OwnedRegularFile } from "./ArtifactReader-PV1DaSaC.js";
import { InvalidUtf8FileError, init_RegularFileRead, readRegularFileText } from "./RegularFileRead-4snB6-IE.js";
import { ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-BLhM2W5p.js";
import { appDataRedirection, classifyClientRegistrationCommand, clientOwnershipEvidencePaths, clientSharedRegistrationPaths, init_ClientRegistrationIdentity, init_MsixPackageStorage, init_SupportedClients, manualRegistrationRemediation, redirectedWriteBlocker, registrationWriteBlocker, supportedClients } from "./SupportedClients-cYThuJwT.js";
import { homeDirectoryFromEnvironment, init_homeDirectory } from "./homeDirectory-CgrzFhoH.js";
import { init_LinuxHopperCacheDirectory, linuxHopperReleaseCacheDirectory } from "./LinuxHopperCacheDirectory-DrnvgmLm.js";
import { CURRENT_ENTRYPOINT_PATH, init_CurrentEntrypointPath } from "./CurrentEntrypointPath-m7QCIVN0.js";
import { ClientConfigurationShapeError, MANAGED_SKILL_FILES, clientConfigurationServersKey, clientServerPath, dshDocument, init_ClientConfigurationDocument, init_ClientRegistration, init_DshCordisPatch, init_SetupRecoveryBackup, init_SetupSkill, isManagedSkillManifest, legacyClientServerPath, parseClientConfiguration, parseClientRegistrationLauncher, preserveCurrentRecoveryBackup, readSkillFile, serializeClientConfiguration, shadowedClientServers, skillDestinationSelection, withClientServers } from "./ClientRegistration-Cl3KCjlr.js";
import { ClientConfigurationPublication, init_ClientConfigPath, init_ClientConfigurationCleanup, init_ClientConfigurationPublication, isClientConfigurationCleanupFailure, resolveClientConfigTransactionPath, retryClientConfigurationCleanup } from "./ClientConfigurationPublication-BsBbLYjI.js";
import { defaultKunaCacheDirectory, init_kunaCacheDirectory } from "./kunaCacheDirectory-DDt35WsX.js";
import { basename, dirname, join } from "node:path";
import { copyFile, lstat, realpath, rm, rmdir } from "node:fs/promises";
import { constants } from "node:fs";

//#region dist/application/Uninstall.js
var systemFileSystem, runUninstall, removeAll, projectSharedRegistrations, hasOwnershipEvidence, discoveryApplicability, sharedConfigPaths, systemUninstallHost, uninstallConfigPaths, registrationPresent, readClientConfigurationText, readClientConfiguration, itemRead, clientRegistrationRemoval, SHADOWED_UNOWNED_MEMBER_DETAIL, UNOWNED_LEGACY_FALLBACK_DETAIL, backupClientConfiguration, removeClient, resolveUninstallConfigPath, isOwnedRegistration, purgeSelectedData, purgeManagedData, removeManagedPath, removeManagedSkills, inspectManagedSkill, removeManagedSkill, MANAGED_SKILL_DIRECTORIES, removeEmptyManagedDirectories, isKeptDirectory, removeManagedSkillFile, item, collapseUninstallItems, uninstallStatusPriority, isMissing;
function init_Uninstall() {
	return (init_Uninstall = __esmMin((() => {
		init_ClientConfigurationCleanup();
		init_ClientConfigurationDocument();
		init_result();
		init_configurationErrors();
		init_homeDirectory();
		init_kunaCacheDirectory();
		init_LinuxHopperCacheDirectory();
		init_ClientConfigurationPublication();
		init_ClientRegistration();
		init_identity();
		init_SetupSkill();
		init_ClientRegistrationIdentity();
		init_CurrentEntrypointPath();
		init_DshCordisPatch();
		init_ClientConfigPath();
		init_SetupRecoveryBackup();
		init_OwnedRegularFile();
		init_RegularFileRead();
		init_ArtifactResourceScope();
		init_SupportedClients();
		init_MsixPackageStorage();
		systemFileSystem = (resources) => ({
			readText: (path) => readRegularFileText(path, { resources }),
			readRegularText: (path) => readSkillFile(path, resources),
			copy: (source, destination) => copyFile(source, destination, constants.COPYFILE_EXCL),
			publishConfiguration: (path, contents, original) => ClientConfigurationPublication.write(path, contents, original),
			stat: (path) => lstat(path),
			realpath: (path) => realpath(path),
			remove: (path, recursive = true) => rm(path, { recursive }),
			removeEmptyDirectory: (path) => rmdir(path)
		});
		runUninstall = async (purgeData, host = systemUninstallHost()) => {
			let result;
			let primaryFailure;
			let failed = false;
			try {
				const clients = await host.clients();
				const blocked = [];
				for (const client of clients) {
					const blocking = await host.inspectClient(client);
					if (blocking !== undefined) blocked.push({
						...blocking,
						configuration_path: client.configPath
					});
				}
				const skillBlocker = await host.inspectSkill?.();
				if (skillBlocker !== undefined) blocked.push(skillBlocker);
				const items = blocked.length > 0 ? [...blocked, item("uninstall", "skipped", "No REA registration, skill, or data was removed. Repair each failed configuration, then rerun uninstall.")] : await removeAll(clients, purgeData, host);
				items.push({
					name: "analysis_engine",
					status: "retained",
					detail: "Hopper is not owned by REA uninstall."
				});
				const reported = collapseUninstallItems(projectSharedRegistrations(items, clients));
				result = {
					status: reported.some(({ status }) => status === "failed") ? "failed" : "complete",
					items: reported
				};
			} catch (cause) {
				failed = true;
				primaryFailure = cause;
			}
			let cleanupFailure;
			try {
				cleanupFailure = await host.close?.();
			} catch (cause) {
				cleanupFailure = `Uninstall resource cleanup failed: ${cause instanceof Error ? cause.message : String(cause)}`;
			}
			if (failed) {
				if (cleanupFailure !== undefined) throw new AggregateError([primaryFailure, new Error(cleanupFailure)], "Uninstall failed and its resource cleanup remains incomplete.", { cause: primaryFailure });
				throw primaryFailure;
			}
			if (result === undefined) throw new Error("Uninstall result was not produced.");
			if (cleanupFailure === undefined) return result;
			const items = collapseUninstallItems([...result.items, item("uninstall_cleanup", "failed", cleanupFailure)]);
			return {
				status: "failed",
				items
			};
		};
		removeAll = async (clients, purgeData, host) => {
			const items = [];
			for (const client of clients) {
				const removed = await host.removeClient(client);
				items.push({
					...removed,
					configuration_path: client.configPath
				});
				if (removed.status === "failed") return [...items, item("uninstall", "skipped", "Uninstall stopped at this failure; the items above report what changed. Repair the failed configuration, then rerun uninstall.")];
			}
			items.push(await host.removeSkill());
			if (purgeData) items.push(...await host.purgeData());
			return items;
		};
		projectSharedRegistrations = (items, clients) => {
			const readersByRegistration = new Map();
			for (const client of clients) if (client.sharedWith !== undefined && client.sharedWith.length > 0) readersByRegistration.set(JSON.stringify([client.name, client.configPath]), client.sharedWith);
			if (readersByRegistration.size === 0) return [...items];
			return items.flatMap((next) => {
				const readers = next.configuration_path === undefined ? undefined : readersByRegistration.get(JSON.stringify([next.name, next.configuration_path]));
				if (readers === undefined) return [next];
				const { name, ...action } = next;
				return [name, ...readers].map((reader) => ({
					...action,
					name: reader
				}));
			});
		};
		hasOwnershipEvidence = async (client, fileSystem) => {
			for (const path of clientOwnershipEvidencePaths(client)) {
				let original;
				try {
					original = await fileSystem.readText(path);
				} catch (cause) {
					if (!(cause instanceof RegularFileCleanupFailure)) continue;
					if (cause.outcome.kind !== "completed") continue;
					const completed = cause.outcome.value;
					if (typeof completed !== "string") continue;
					original = completed;
				}
				let parsed;
				try {
					parsed = parseClientConfiguration(original, client.format);
				} catch {
					continue;
				}
				const removal = clientRegistrationRemoval(parsed, original, client);
				const owned = removal.ok ? removal.value : removal.error.owned;
				if (owned.removeNative || owned.legacyPath !== undefined) return true;
			}
			return false;
		};
		discoveryApplicability = async (discoveryPaths, fileSystem) => {
			if (discoveryPaths === undefined) return {
				applicable: true,
				unresolved: false
			};
			let applicable = false;
			let unresolved = false;
			for (const path of discoveryPaths) {
				try {
					const stats = await fileSystem.stat(path);
					if (stats.isSymbolicLink() && fileSystem.realpath !== undefined) await fileSystem.realpath(path);
					return {
						applicable: true,
						unresolved: false
					};
				} catch (cause) {
					if (!isMissing(cause)) unresolved = true;
				}
			}
			return {
				applicable,
				unresolved
			};
		};
		sharedConfigPaths = (clients) => {
			const claimsByPath = new Map();
			for (const client of clients) for (const claim of [...uninstallConfigPaths(client).map((configPath) => ({
				client,
				configPath,
				fallback: false
			})), ...client.zcodeFallbackPath === undefined ? [] : [{
				client,
				configPath: client.zcodeFallbackPath,
				fallback: true
			}]]) claimsByPath.set(claim.configPath, [...claimsByPath.get(claim.configPath) ?? [], claim]);
			return [...claimsByPath.values()].flatMap((claims) => {
				const fallbacks = claims.filter((claim) => claim.fallback);
				const owners = claims.filter((claim) => !claim.fallback);
				if (owners.length > 0) return owners.map((owner) => {
					const format = owner.client.format;
					const readers = format !== undefined && format !== "unsupported" && format !== "dsh" && clientConfigurationServersKey(format) === clientConfigurationServersKey("zcode_fallback") ? fallbacks : [];
					return {
						owner,
						readers
					};
				});
				const [only] = fallbacks;
				if (only === undefined) throw new Error("A configuration path has no claiming client.");
				return [{
					owner: only,
					readers: []
				}];
			});
		};
		systemUninstallHost = (selectedHome = undefined, selectedFileSystem = undefined, environment = process.env, platform = process.platform) => {
			const home = selectedHome ?? homeDirectoryFromEnvironment(environment, platform);
			const resources = new ArtifactResourceScope();
			const configurationOperations = new ArtifactResourceScope();
			const fileSystem = selectedFileSystem ?? systemFileSystem(resources);
			const preflightOwnedClients = new WeakSet();
			let redirection;
			const clientWriteBlocker = (client) => registrationWriteBlocker(client, "uninstall") ?? redirectedWriteBlocker(redirection, [client.configPath], "uninstall");
			const skillWriteBlocker = (path) => redirectedWriteBlocker(redirection, [path], "uninstall");
			return {
				clients: async () => {
					const supported = supportedClients(home, platform, environment);
					redirection = appDataRedirection(supported);
					const probes = new Map();
					for (const client of supported) probes.set(client.name, await discoveryApplicability(client.discoveryPaths, fileSystem));
					const paths = sharedConfigPaths(supported);
					const clients = [];
					for (const client of supported) for (const path of paths) {
						if (path.owner.client !== client) continue;
						const readers = path.readers.filter(({ client: reader }) => {
							const probe = probes.get(reader.name);
							return probe?.applicable === true || probe?.unresolved === true;
						});
						const probesForPath = [path.owner, ...readers].map(({ client: participant }) => probes.get(participant.name) ?? {
							applicable: false,
							unresolved: false
						});
						const applicability = probesForPath.some(({ applicable }) => applicable) || probesForPath.some(({ unresolved }) => unresolved) || !clientSharedRegistrationPaths(client).has(path.owner.configPath) ? {} : { applicability: "unverified" };
						clients.push({
							...client,
							configPath: path.owner.configPath,
							...path.owner.fallback ? { format: "zcode_fallback" } : {},
							...applicability,
							...readers.length === 0 ? {} : { sharedWith: readers.map(({ client: reader }) => reader.name) }
						});
					}
					return clients;
				},
				inspectClient: (client) => configurationOperations.run(async () => {
					const ownershipEstablished = client.sharedRegistration === true && clientOwnershipEvidencePaths(client).length > 0 && await hasOwnershipEvidence(client, fileSystem);
					const read = await readClientConfiguration(client, fileSystem, resources, ownershipEstablished);
					if (read.kind === "item") return read.item.status === "failed" ? read.item : undefined;
					const removal = clientRegistrationRemoval(read.parsed, read.original, client);
					if (!removal.ok) return item(client.name, "failed", removal.error.detail);
					if (!removal.value.removeNative && removal.value.legacyPath === undefined) return undefined;
					preflightOwnedClients.add(client);
					const blocker = clientWriteBlocker(client);
					return blocker === undefined ? undefined : item(client.name, "failed", blocker);
				}),
				removeClient: (client) => configurationOperations.run(() => removeClient(client, fileSystem, resources, () => clientWriteBlocker(client), preflightOwnedClients.has(client))),
				inspectSkill: async () => {
					const selection = skillDestinationSelection(home, undefined, environment, platform);
					if (selection.issues.length > 0) return item("skill", "failed", selection.issues.map(({ path, detail }) => `${detail} (${path})`).join(" "));
					for (const destination of selection.destinations) {
						const inspected = await inspectManagedSkill(destination.path, destination.client, fileSystem);
						if (inspected?.status === "failed") return inspected;
						if (inspected !== undefined) continue;
						const blocker = skillWriteBlocker(destination.path);
						if (blocker !== undefined) return item("skill", "failed", blocker);
					}
					return undefined;
				},
				removeSkill: () => removeManagedSkills(home, fileSystem, environment, platform, skillWriteBlocker),
				purgeData: () => purgeSelectedData(home, environment, platform, fileSystem),
				close: async () => {
					try {
						await configurationOperations.close();
						await resources.close();
						return undefined;
					} catch (cause) {
						return `Uninstall resource cleanup failed: ${cause instanceof Error ? cause.message : String(cause)}`;
					}
				}
			};
		};
		uninstallConfigPaths = (client) => [...new Set([...client.configPaths ?? [client.configPath], ...client.msixPackage === undefined ? [] : [client.msixPackage.privateConfigPath, client.msixPackage.appDataConfigPath]])];
		registrationPresent = (parsed) => {
			const name = PRODUCT_IDENTITY.mcpServerKey;
			return Object.hasOwn(parsed.servers, name) || legacyClientServerPath(parsed, name) !== undefined || parsed.dialect === "dsh" && dshDocument(parsed.document).carriesEntry;
		};
		readClientConfigurationText = async (client, transactionPath, io) => {
			try {
				return await io.fileSystem.readText(transactionPath);
			} catch (cause) {
				if (isClientConfigurationCleanupFailure(cause)) {
					const cleanup = await retryClientConfigurationCleanup(cause, io.resources);
					const detail = cleanup.primary instanceof InvalidUtf8FileError ? "Configuration is not valid UTF-8 and was not changed; its resources could not be released. Repair it, then rerun uninstall." : "Configuration could not be read or its resources could not be released. Check file permissions, then rerun uninstall.";
					if (cleanup.cleanup !== undefined) return itemRead(item(client.name, "failed", detail));
					const completed = cause.outcome.kind === "completed" ? cause.outcome.value : undefined;
					if (typeof completed !== "string") return io.configurationFailure(detail);
					return completed;
				}
				return isMissing(cause) ? itemRead(item(client.name, "skipped", "Configuration does not exist.")) : io.configurationFailure(cause instanceof InvalidUtf8FileError ? "Configuration is not valid UTF-8 and was not changed. Repair it, then rerun uninstall." : "Configuration could not be read. Check file permissions, then rerun uninstall.");
			}
		};
		readClientConfiguration = async (client, fileSystem, resources, ownershipEstablished = false) => {
			const applicabilityUnverified = client.applicability === "unverified" && !ownershipEstablished;
			const configurationFailure = (detail) => itemRead(item(client.name, applicabilityUnverified ? "retained" : "failed", applicabilityUnverified ? `Product applicability could not be established. Shared configuration was retained without blocking other REA removals. ${detail}` : detail));
			if (client.configPathError !== undefined) return configurationFailure(client.configPathError);
			if (client.format === "unsupported") return itemRead(item(client.name, "skipped", manualRegistrationRemediation(client.name) ?? "This client has no documented local MCP configuration boundary."));
			const resolved = await resolveUninstallConfigPath(client, fileSystem);
			if (typeof resolved !== "string") return resolved.status === "failed" ? configurationFailure(resolved.detail) : itemRead(resolved);
			const transactionPath = resolved;
			const original = await readClientConfigurationText(client, transactionPath, {
				fileSystem,
				resources,
				configurationFailure
			});
			if (typeof original !== "string") return original;
			try {
				const parsed = parseClientConfiguration(original, client.format);
				return {
					kind: "configuration",
					transactionPath,
					original,
					parsed
				};
			} catch (cause) {
				return configurationFailure(cause instanceof ClientConfigurationShapeError || cause instanceof ConfigurationError ? `Configuration was not changed: ${cause.message}. Repair it, then rerun uninstall.` : `Configuration is not valid ${client.format === "toml" || client.format === "grok" ? "TOML" : client.format === "opencode" ? "JSONC" : client.format === "hermes" || client.format === "dsh" ? "YAML" : "JSON"} and was not changed. Repair it, then rerun uninstall.`);
			}
		};
		itemRead = (result) => ({
			kind: "item",
			item: result
		});
		clientRegistrationRemoval = (parsed, original, client) => {
			const name = PRODUCT_IDENTITY.mcpServerKey;
			if (parsed.dialect === "dsh" && dshDocument(parsed.document).hasUnknownStructure) return ok({
				removeNative: false,
				legacyPath: undefined
			});
			const removeNative = parsed.dialect === "dsh" && dshDocument(parsed.document).carriesEntry || Object.hasOwn(parsed.servers, name) && isOwnedRegistration(parsed.servers[name], client);
			const legacyPath = legacyClientServerPath(parsed, name);
			const removeLegacy = legacyPath !== undefined && isOwnedRegistration(parsed.legacyServers[name], client);
			const ownership = {
				removeNative,
				legacyPath: removeLegacy ? legacyPath : undefined
			};
			if (removeNative || removeLegacy) {
				const shadowed = shadowedClientServers(original, parsed, name);
				if (removeNative && shadowed.servers.some((member) => !isOwnedRegistration(member, client)) || removeLegacy && shadowed.legacyServers.some((member) => !isOwnedRegistration(member, client))) return err({
					kind: "shadowed_unowned_member",
					detail: SHADOWED_UNOWNED_MEMBER_DETAIL,
					owned: ownership
				});
			}
			if (removeNative && legacyPath !== undefined && !removeLegacy) return err({
				kind: "foreign_legacy_fallback",
				detail: UNOWNED_LEGACY_FALLBACK_DETAIL,
				owned: ownership
			});
			return ok(ownership);
		};
		SHADOWED_UNOWNED_MEMBER_DETAIL = `Configuration repeats the "${PRODUCT_IDENTITY.mcpServerKey}" member, and an earlier duplicate is not REA-owned; removing the registration the client reads would activate an earlier duplicate, so no change was made. Remove the duplicate members manually, then rerun uninstall.`;
		UNOWNED_LEGACY_FALLBACK_DETAIL = `OpenCode falls back to the V1 "mcp.${PRODUCT_IDENTITY.mcpServerKey}" entry, which is not REA-owned; removing REA's native registration would activate it, so no change was made. Remove or replace that V1 entry manually, then rerun uninstall.`;
		backupClientConfiguration = async (client, transactionPath, original, options) => {
			const failed = (detail) => item(client.name, "failed", `Configuration could not be backed up, so no change was made. ${detail}`);
			try {
				const preserved = await preserveCurrentRecoveryBackup(`${client.configPath}.rea.backup`, transactionPath, original, options);
				if (preserved.ok) return preserved.value;
				if (preserved.error.kind === "occupied") return failed(`${preserved.error.detail}. Move that file aside, then rerun uninstall.`);
			} catch (cause) {
				if (!(cause instanceof RegularFileCleanupFailure)) throw cause;
			}
			return failed("Check file permissions, then rerun uninstall.");
		};
		removeClient = async (client, fileSystem, resources, writeBlocker, preflightOwned = false) => {
			const read = await readClientConfiguration(client, fileSystem, resources, preflightOwned);
			if (read.kind === "item") return read.item;
			const { transactionPath, original, parsed } = read;
			const name = PRODUCT_IDENTITY.mcpServerKey;
			if (parsed.dialect === "dsh" && dshDocument(parsed.document).hasUnknownStructure) return item(client.name, "retained", "A Cordis expression may produce registration rows, so the patch was retained without changes.");
			if (!registrationPresent(parsed)) return item(client.name, "skipped", "REA registration is absent.");
			const removal = clientRegistrationRemoval(parsed, original, client);
			if (!removal.ok) return item(client.name, "failed", removal.error.detail);
			const { removeNative, legacyPath } = removal.value;
			const removeLegacy = legacyPath !== undefined;
			if (!removeNative && !removeLegacy) return item(client.name, "retained", "The rea-named registration is not REA-owned.");
			const blocker = writeBlocker?.();
			if (blocker !== undefined) return item(client.name, "failed", blocker);
			const remaining = { ...parsed.servers };
			if (removeNative) delete remaining[name];
			const document = withClientServers(parsed, remaining, removeLegacy ? name : undefined);
			const editedPaths = [...removeNative ? [clientServerPath(parsed, name)] : [], ...legacyPath === undefined ? [] : [legacyPath]];
			let serialized;
			try {
				serialized = serializeClientConfiguration(document, client.format, original, editedPaths, { removeShadowedMembersAt: editedPaths });
			} catch {
				return item(client.name, "failed", "Configuration could not be updated, so no change was made. Repair the configuration, then rerun uninstall.");
			}
			if (!serialized.ok) return item(client.name, "failed", `Configuration repeats the member at ${JSON.stringify(serialized.error.path)}; removing the registration the client reads would activate an earlier duplicate, so no change was made. Remove the duplicate members manually, then rerun uninstall.`);
			const backupPath = await backupClientConfiguration(client, transactionPath, original, {
				copy: (source, destination) => fileSystem.copy(source, destination),
				resources
			});
			if (typeof backupPath !== "string") return backupPath;
			const manualRecovery = () => item(client.name, "failed", `Configuration could not be updated or restored. Restore the backup at ${backupPath} manually, then rerun uninstall.`);
			let publication;
			try {
				publication = await fileSystem.publishConfiguration(transactionPath, serialized.value, original);
			} catch (cause) {
				if (isClientConfigurationCleanupFailure(cause)) await retryClientConfigurationCleanup(cause, resources);
				return manualRecovery();
			}
			try {
				return await publication.verify(async () => {
					try {
						const readback = parseClientConfiguration(await fileSystem.readText(publication.path), client.format);
						await publication.assertCurrent();
						if (removeNative && Object.hasOwn(readback.servers, name) || readback.dialect === "dsh" && dshDocument(readback.document).carriesEntry || removeLegacy && Object.hasOwn(readback.legacyServers, name)) throw new Error("registration readback mismatch");
						return item(client.name, "removed", `Removed registration from ${client.configPath}.`);
					} catch (cause) {
						if (isClientConfigurationCleanupFailure(cause)) await retryClientConfigurationCleanup(cause, resources);
						try {
							await publication.restore(original);
						} catch {
							return manualRecovery();
						}
						return item(client.name, "failed", `Configuration could not be updated. The original was restored and its backup at ${backupPath} was retained. Repair the configuration or restore that backup, then rerun uninstall.`);
					}
				});
			} catch (cause) {
				if (isClientConfigurationCleanupFailure(cause)) await retryClientConfigurationCleanup(cause, resources);
				return item(client.name, "failed", `Configuration verification or resource cleanup failed. The backup at ${backupPath} was retained. Check the configuration and rerun uninstall.`);
			}
		};
		resolveUninstallConfigPath = async (client, fileSystem) => {
			const path = await resolveClientConfigTransactionPath(client.configPath, fileSystem.realpath === undefined ? { lstat: fileSystem.stat } : {
				lstat: fileSystem.stat,
				realpath: fileSystem.realpath
			});
			return path ?? item(client.name, "failed", "Configuration path could not be safely verified. Check its permissions and, if it is a symbolic link, verify that the link resolves to a regular file owned by the current user, then rerun uninstall.");
		};
		isOwnedRegistration = (value, client) => {
			const parsed = parseClientRegistrationLauncher(value, client);
			if (!parsed.ok) return false;
			const { command, args } = parsed.value;
			return classifyClientRegistrationCommand([command, ...args], CURRENT_ENTRYPOINT_PATH) === "owned";
		};
		purgeSelectedData = async (home, environment, platform, fileSystem) => {
			const items = [...await purgeManagedData(join(home, ".rea"), fileSystem, ["cache", "state"])];
			const directories = [];
			if (platform === "darwin" || platform === "linux") {
				directories.push(defaultKunaCacheDirectory(home, environment, platform));
				const custom = environment.REA_KUNA_CACHE_DIR;
				if (custom !== undefined && custom !== directories[0]) items.push(item("kuna-custom-cache", "retained", `Caller-selected Kuna cache ${custom} was retained because purge does not establish ownership of that entire directory.`));
			}
			if (platform === "linux") {
				const hopper = linuxHopperReleaseCacheDirectory(environment, home);
				if (hopper.ok) directories.push(hopper.value);
				else items.push(item("hopper-releases", "failed", hopper.error.message));
			}
			for (const directory of directories) items.push(...await purgeManagedData(dirname(directory), fileSystem, [basename(directory)]));
			return items;
		};
		purgeManagedData = async (root, fileSystem, names) => {
			try {
				const stats = await fileSystem.stat(root);
				const linked = stats.isSymbolicLink();
				if (linked || stats.isDirectory?.() !== true) return names.map((name) => item(name, "retained", `REA did not remove this item because its managed data root ${root} is ${linked ? "a symbolic link" : "not a directory"}. Verify the root before removing its data manually.`));
			} catch (cause) {
				return names.map((name) => isMissing(cause) ? item(name, "skipped", `${join(root, name)} does not exist.`) : item(name, "failed", `The managed data root ${root} could not be verified. Check its permissions, then rerun uninstall.`));
			}
			const items = [];
			for (const name of names) items.push(await removeManagedPath(join(root, name), name, fileSystem));
			return items;
		};
		removeManagedPath = async (path, name, fileSystem) => {
			try {
				const stats = await fileSystem.stat(path);
				if (stats.isSymbolicLink()) return item(name, "retained", "REA did not remove this item because its managed path is a symbolic link. Verify the link target before removing it manually.");
				await fileSystem.remove(path);
				return item(name, "removed", `Removed ${path}.`);
			} catch (cause) {
				return isMissing(cause) ? item(name, "skipped", `${path} does not exist.`) : item(name, "failed", "This item could not be removed. Check file permissions, then rerun uninstall.");
			}
		};
		removeManagedSkills = async (home, fileSystem, environment, platform, writeBlocker) => {
			const selection = skillDestinationSelection(home, undefined, environment, platform);
			if (selection.issues.length > 0) return item("skill", "failed", selection.issues.map(({ path, detail }) => `${detail} (${path})`).join(" "));
			const results = await Promise.all(selection.destinations.map(({ client, path }) => removeManagedSkill(path, `${client} (${path})`, fileSystem, writeBlocker)));
			const failed = results.find(({ status }) => status === "failed");
			if (failed !== undefined) return item("skill", "failed", results.map(({ name, status, detail }) => `${name}: ${status} (${detail})`).join(" "));
			const status = results.some(({ status: resultStatus }) => resultStatus === "removed") ? "removed" : results.some(({ status: resultStatus }) => resultStatus === "retained") ? "retained" : "skipped";
			return item("skill", status, results.map(({ name, status: resultStatus, detail }) => `${name}: ${resultStatus} (${detail})`).join(" "));
		};
		inspectManagedSkill = async (path, name, fileSystem) => {
			let root;
			try {
				root = await fileSystem.stat(path);
			} catch (cause) {
				return isMissing(cause) ? item(name, "skipped", "Skill directory does not exist.") : item(name, "failed", "Skill directory could not be inspected.");
			}
			if (root.isSymbolicLink()) return item(name, "retained", "Skill directory is a symbolic link.");
			if (root.isDirectory?.() !== true) return item(name, "retained", "Skill path is not a directory.");
			const manifestPath = join(path, "SKILL.md");
			try {
				const manifest = await fileSystem.stat(manifestPath);
				if (manifest.isSymbolicLink()) return item(name, "retained", "Skill manifest is a symbolic link.");
				if (manifest.isFile?.() !== true) return item(name, "retained", "Skill manifest is not a regular file.");
			} catch (cause) {
				return isMissing(cause) ? item(name, "retained", "Skill ownership could not be established.") : item(name, "failed", "Skill manifest could not be inspected.");
			}
			let content;
			try {
				content = await (fileSystem.readRegularText?.(manifestPath) ?? fileSystem.readText(manifestPath));
			} catch (cause) {
				return isMissing(cause) ? item(name, "retained", "Skill ownership could not be established.") : item(name, "failed", "Skill manifest could not be read.");
			}
			if (!isManagedSkillManifest(content)) return item(name, "retained", "Skill manifest is not REA-owned.");
			return undefined;
		};
		removeManagedSkill = async (path, name, fileSystem, writeBlocker) => {
			const inspection = await inspectManagedSkill(path, name, fileSystem);
			if (inspection !== undefined) return inspection;
			const blocker = writeBlocker?.(path);
			if (blocker !== undefined) return item(name, "failed", blocker);
			const manifestName = "SKILL.md";
			const otherFiles = MANAGED_SKILL_FILES.filter((relativePath) => relativePath !== manifestName);
			const results = [];
			for (const relativePath of otherFiles) results.push(await removeManagedSkillFile(path, relativePath, name, fileSystem));
			if (results.some(({ status }) => status === "failed" || status === "retained")) results.push(item(name, "retained", "REA ownership manifest was retained because a managed file could not be safely removed."));
			else {
				const manifest = await removeManagedSkillFile(path, manifestName, name, fileSystem);
				results.push(manifest);
				const directories = manifest.status === "removed" ? await removeEmptyManagedDirectories(path, name, fileSystem) : undefined;
				if (directories !== undefined) results.push(directories);
			}
			const failed = results.find(({ status }) => status === "failed");
			if (failed !== undefined) return item(name, "failed", results.map(({ detail }) => detail).join(" "));
			if (results.some(({ status }) => status === "retained")) return item(name, "retained", [...new Set(results.map(({ detail }) => detail))].join(" "));
			const removed = results.some(({ status }) => status === "removed");
			return item(name, removed ? "removed" : "skipped", "REA-managed skill files were removed; other files were preserved.");
		};
		MANAGED_SKILL_DIRECTORIES = [...new Set(MANAGED_SKILL_FILES.map((relativePath) => relativePath.split("/").slice(0, -1).join("/")).filter((directory) => directory.length > 0))].sort((left, right) => right.split("/").length - left.split("/").length);
		removeEmptyManagedDirectories = async (root, name, fileSystem) => {
			if (fileSystem.removeEmptyDirectory === undefined) return undefined;
			for (const directory of [...MANAGED_SKILL_DIRECTORIES.map((relative) => join(root, relative)), root]) {
				try {
					await fileSystem.removeEmptyDirectory(directory);
				} catch (cause) {
					if (!isKeptDirectory(cause)) return item(name, "failed", `Managed skill directory could not be removed: ${directory}.`);
				}
			}
			return undefined;
		};
		isKeptDirectory = (cause) => cause instanceof Error && "code" in cause && [
			"ENOTEMPTY",
			"EEXIST",
			"ENOENT",
			"ENOTDIR"
		].includes(String(cause.code));
		removeManagedSkillFile = async (root, relativePath, name, fileSystem) => {
			const segments = relativePath.split(/[\\/]/u);
			let parent = root;
			for (const segment of segments.slice(0, -1)) {
				parent = join(parent, segment);
				try {
					const stats = await fileSystem.stat(parent);
					if (stats.isSymbolicLink() || stats.isDirectory?.() !== true) return item(name, "retained", `Managed path parent was retained: ${parent}.`);
				} catch (cause) {
					return isMissing(cause) ? item(name, "skipped", `${join(parent, segments.at(-1) ?? "")} does not exist.`) : item(name, "failed", `Managed path parent could not be inspected: ${parent}.`);
				}
			}
			const target = join(root, relativePath);
			let stats;
			try {
				stats = await fileSystem.stat(target);
			} catch (cause) {
				return isMissing(cause) ? item(name, "skipped", `${target} does not exist.`) : item(name, "failed", `Managed file could not be inspected: ${target}.`);
			}
			if (stats.isSymbolicLink()) return item(name, "retained", `Managed file is a symbolic link: ${target}.`);
			if (stats.isFile?.() !== true) return item(name, "retained", `Managed path is not a regular file: ${target}.`);
			try {
				await fileSystem.remove(target, false);
				return item(name, "removed", `Removed ${target}.`);
			} catch (cause) {
				return isMissing(cause) ? item(name, "skipped", `${target} does not exist.`) : item(name, "failed", `Managed file could not be removed: ${target}.`);
			}
		};
		item = (name, status, detail) => ({
			name,
			status,
			detail
		});
		collapseUninstallItems = (items) => {
			const grouped = new Map();
			for (const next of items) {
				const { name, actions, ...action } = next;
				const group = grouped.get(name) ?? [];
				group.push(...actions !== undefined && actions.length > 0 ? actions : [action]);
				grouped.set(name, group);
			}
			return [...grouped].map(([name, actions]) => {
				const first = actions[0];
				if (first === undefined) throw new Error("Uninstall outcome group has no actions.");
				if (actions.length === 1) return {
					name,
					...first
				};
				const status = actions.reduce((selected, action) => uninstallStatusPriority(action.status) > uninstallStatusPriority(selected) ? action.status : selected, first.status);
				return {
					name,
					status,
					detail: [...new Set(actions.map(({ detail }) => detail))].join(" "),
					actions
				};
			});
		};
		uninstallStatusPriority = (status) => {
			switch (status) {
				case "failed": return 3;
				case "removed": return 2;
				case "retained": return 1;
				case "skipped": return 0;
				default: {
					const exhaustive = status;
					throw new TypeError(`Unhandled uninstall item status: ${String(exhaustive)}`);
				}
			}
		};
		isMissing = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
	})))();
}

//#endregion
init_Uninstall();
export { runUninstall, systemUninstallHost };
import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { compareUnicodeCodePoints, init_unicodeCodePointOrder } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisError, init_analysisErrorBase } from "./jsonLines-Gf10X4s1.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-DBL-xO0h.js";
import { appDataRedirection, classifyClientRegistrationCommand, init_ClientRegistrationIdentity, init_MsixPackageStorage, init_SupportedClients, manualRegistrationRemediation, redirectedWriteBlocker, registrationPersistenceDetail } from "./SupportedClients-cYThuJwT.js";
import { LINUX_HOPPER_SETUP_HOSTS, init_LinuxHopper, linuxHopperInstallDisclosure } from "./SharedStartupAttempt-BObuC52s.js";
import { init_MacHopperPaths, macHopperUserApplicationPath } from "./parseConfig-CnsaJFUY.js";
import { CURRENT_ENTRYPOINT_PATH, init_CurrentEntrypointPath } from "./CurrentEntrypointPath-m7QCIVN0.js";
import { SetupSkillInstallError, init_SetupSkill } from "./ClientRegistration-Cl3KCjlr.js";
import { configureDetectedClients, filterClientsNeedingConfigure, hostRemediation, init_MacHopper, init_SetupCleanupOwner, init_SetupClients, init_SetupHost, macHopperInstallDisclosure, setupCleanupError, setupCleanupReason, systemSetupHost } from "./SetupHost-DSfW88mc.js";

//#region dist/application/SetupPlan.js
var discoverSetupState, planSetupActions, plannedClientWrites, setupPlan, linuxDisclosure, hopperInstallRefusal, hopperInstallEligibility, clientConfigurationDetail;
function init_SetupPlan() {
	return (init_SetupPlan = __esmMin((() => {
		init_SetupSkill();
		init_ClientRegistrationIdentity();
		init_LinuxHopper();
		init_MacHopper();
		init_MacHopperPaths();
		init_SupportedClients();
		init_MsixPackageStorage();
		init_unicodeCodePointOrder();
		init_CurrentEntrypointPath();
		discoverSetupState = async (input) => {
			const { initialDoctor } = input;
			const linuxHopperRepairNeeded = input.hopperLauncherConfigured !== true && initialDoctor.checks.some(({ name, ok, detail }) => !ok && (name === "hopper-demo-runtime" || name === "hopper-version" && detail === "/opt/hopper/bin/Hopper"));
			const linuxDistribution = input.host.platform === "linux" ? await input.host.linuxDistribution() : undefined;
			const hopperInstall = hopperInstallEligibility(input.host.platform, input.host.platform === "darwin" ? await input.host.macosVersion() : undefined, linuxDistribution);
			const installHopper = input.forceHopperInstall || hopperInstall.supported && input.proposeHopper && (!input.providerConfigured || linuxHopperRepairNeeded);
			const [clients, detectedClients] = await Promise.all([input.host.supportedClients(), input.host.detectedClients()]);
			const detectedIds = new Set(detectedClients.map(({ name }) => name));
			const registrations = initialDoctor.identity?.registrations ?? [];
			const registrationByClient = new Map(registrations.map((registration) => [registration.client, registration]));
			const clientStates = clients.map((client) => {
				const registration = registrationByClient.get(client.name);
				const commandIdentity = registration === undefined ? undefined : classifyClientRegistrationCommand(registration.command, CURRENT_ENTRYPOINT_PATH);
				const ownedRegistration = (registration?.state === "aligned" || registration?.state === "stale") && commandIdentity === "owned";
				const configured = ownedRegistration;
				const status = registration?.state === "invalid" ? "invalid" : registration?.state === "unknown" || commandIdentity === "unknown" ? "unknown" : ownedRegistration && registration.state === "aligned" ? "configured" : ownedRegistration && registration.state === "stale" ? "needs_configuration" : detectedIds.has(client.name) ? "needs_configuration" : "missing";
				return {
					client,
					detected: detectedIds.has(client.name),
					configured,
					status
				};
			});
			const defaultClientIds = registrations.filter((registration) => (registration.state === "aligned" || registration.state === "stale") && classifyClientRegistrationCommand(registration.command, CURRENT_ENTRYPOINT_PATH) === "owned").map(({ client }) => client);
			return {
				initialDoctor,
				installHopper,
				hopperInstall,
				clients,
				detectedClientIds: [...detectedIds],
				defaultClientIds,
				clientStates,
				...linuxDistribution?.packageFamily === undefined ? {} : { linuxPackageFamily: linuxDistribution.packageFamily }
			};
		};
		planSetupActions = async (input) => {
			const byId = new Map(input.discovery.clients.map((client) => [client.name, client]));
			const unknownClient = input.clientIds.find((id) => !byId.has(id));
			if (unknownClient !== undefined) {
				return {
					plannedActions: [],
					selectedClients: [],
					clientsToConfigure: [],
					blocker: `Unsupported setup client: ${unknownClient}.`
				};
			}
			const selectedClients = input.clientIds.flatMap((id) => {
				const client = byId.get(id);
				return client === undefined ? [] : [client];
			});
			const hopperCache = input.host.linuxHopperReleaseCache;
			if (input.discovery.installHopper && hopperCache?.ok === false) return {
				plannedActions: [],
				selectedClients,
				clientsToConfigure: [],
				blocker: hopperCache.error.message
			};
			if (selectedClients.length > 0 && input.host.registrationCommandBlocker !== undefined) return {
				plannedActions: [],
				selectedClients,
				clientsToConfigure: [],
				blocker: input.host.registrationCommandBlocker
			};
			const inspections = await Promise.all(selectedClients.map(async (client) => ({
				client,
				inspection: await input.host.inspectClientConfiguration(client, input.providerEnvironment, input.command)
			})));
			const invalid = inspections.find(({ inspection }) => inspection.status === "invalid");
			if (invalid?.inspection.status === "invalid") {
				return {
					plannedActions: [],
					selectedClients,
					clientsToConfigure: [],
					blocker: `${invalid.client.displayName ?? invalid.client.name}: ${invalid.inspection.remediation}`
				};
			}
			let skillDestinations = [];
			try {
				if (input.installSkill) skillDestinations = input.host.skillDestinations(input.skillClientIds);
			} catch (cause) {
				if (!(cause instanceof SetupSkillInstallError)) throw cause;
				return {
					plannedActions: [],
					selectedClients,
					clientsToConfigure: [],
					blocker: cause.remediation
				};
			}
			const clientPlans = plannedClientWrites(inspections, input.discovery.installHopper);
			const plannedActions = setupPlan({
				platform: input.host.platform,
				homeDirectory: input.host.homeDirectory,
				...hopperCache?.ok === true ? { hopperCacheDirectory: hopperCache.value } : {},
				installHopper: input.discovery.installHopper,
				installSkill: input.installSkill,
				skillClientIds: input.skillClientIds,
				skillDestinations,
				clients: clientPlans,
				providerEnvironment: input.providerEnvironment,
				...input.discovery.linuxPackageFamily === undefined ? {} : { linuxPackageFamily: input.discovery.linuxPackageFamily },
				command: input.command
			});
			const blocker = (clientPlans.length > 0 ? input.host.registrationCommandBlocker : undefined) ?? redirectedWriteBlocker(appDataRedirection(input.discovery.clients), plannedActions.filter(({ kind }) => kind !== "install_hopper").map(({ target }) => target), "setup");
			return {
				plannedActions,
				selectedClients,
				clientsToConfigure: selectedClients.filter((client) => clientPlans.some(({ client: planned }) => planned.name === client.name)),
				...blocker === undefined ? {} : { blocker }
			};
		};
		plannedClientWrites = (inspections, installHopper) => inspections.flatMap(({ client, inspection }) => client.format !== "unsupported" && (inspection.status === "create" || inspection.status === "update" || installHopper && inspection.status === "already_current") ? [{
			client,
			operation: inspection.status === "already_current" ? "update" : inspection.status,
			...inspection.status !== "already_current" && inspection.backupPath !== undefined ? { backupPath: inspection.backupPath } : {}
		}] : []);
		setupPlan = (input) => [
			...input.installHopper ? [{
				id: "install_hopper",
				kind: "install_hopper",
				label: "Hopper deep-analysis provider",
				target: input.platform === "darwin" ? macHopperUserApplicationPath(input.homeDirectory) : "system package manager",
				detail: input.platform === "linux" ? `Download the current official Hopper demo, verify its PGP publisher and launcher bytes, and retain archive, public-key.asc and release.json under ${input.hopperCacheDirectory ?? `${input.homeDirectory}/.cache/rea/hopper-releases`}/<launcher-sha256> for offline verification. Preserve replaced damaged evidence beside it as <launcher-sha256>.backup-<id>. Install Hopper plus its Xvfb demo-session dependencies${input.linuxPackageFamily === "deb" ? ", including the shared library matching the distribution Python interpreter" : ""}. REA uses a private display and selects Hopper's offered demo mode for each analysis session.` : "Download the official Hopper package, verify it, and install it. Hopper may show its demo or license prompt when first opened.",
				external: true,
				operation: "install",
				...input.platform === "linux" ? input.linuxPackageFamily === undefined ? {} : linuxDisclosure(input.linuxPackageFamily) : {
					networkOrigins: macHopperInstallDisclosure.networkOrigins,
					commands: macHopperInstallDisclosure.commands
				}
			}] : [],
			...input.clients.filter(({ client }) => client.format !== "unsupported").map(({ client, operation, backupPath }) => ({
				id: `configure_client:${client.name}`,
				kind: "configure_client",
				label: client.displayName ?? client.name,
				target: client.configPath,
				detail: clientConfigurationDetail(client, input.command, input.providerEnvironment, input.installHopper),
				external: false,
				operation,
				...backupPath === undefined ? {} : { backupPath }
			})),
			...input.installSkill ? input.skillDestinations.map(({ client, path }) => ({
				id: client === "shared" ? "install_skill" : `install_skill:${client}`,
				kind: "install_skill",
				label: client === "claude_code" ? "REA skill for Claude Code" : "REA reverse-engineering skill",
				target: path,
				detail: client === "claude_code" ? "Install or update the REA skill in Claude Code's personal skill directory." : "Install or update the bundled REA reverse-engineering skill and on-demand references.",
				external: false,
				operation: "install"
			})) : []
		];
		linuxDisclosure = (family) => {
			const disclosure = linuxHopperInstallDisclosure(family, process.getuid?.() === 0);
			return {
				networkOrigins: disclosure.networkOrigins,
				commands: disclosure.commands,
				integrity: disclosure.integrity
			};
		};
		hopperInstallRefusal = (discovery) => discovery.installHopper && !discovery.hopperInstall.supported ? discovery.hopperInstall.remediation : undefined;
		hopperInstallEligibility = (platform, macosVersion, linuxDistribution) => {
			if (platform === "darwin") {
				const major = macosVersion === undefined ? undefined : /^(\d+)(?:\.|$)/u.exec(macosVersion)?.[1];
				return major !== undefined && Number(major) >= 12 ? { supported: true } : {
					supported: false,
					remediation: "Upgrade to macOS 12 or newer."
				};
			}
			if (platform === "linux") return linuxDistribution?.hopperSetupSupported === true ? { supported: true } : {
				supported: false,
				remediation: `Automated Hopper setup requires ${LINUX_HOPPER_SETUP_HOSTS}; configure an existing supported provider instead.`
			};
			return {
				supported: false,
				remediation: "REA supports Hopper on macOS and selected x86_64 Linux distributions."
			};
		};
		clientConfigurationDetail = (client, command, environment, installHopper) => {
			const entries = Object.entries(environment).sort(([left], [right]) => compareUnicodeCodePoints(left, right)).map(([name, value]) => `${name}=${value}`);
			const environmentDetail = entries.length === 0 ? " No additional provider environment variables. Existing server environment overrides are retained." : ` Detected provider environment: ${entries.join(", ")}. Existing server environment overrides are retained; detected values replace matching keys.`;
			const hopperDetail = installHopper ? environment.HOPPER_LAUNCHER_PATH === undefined ? " If this plan installs Hopper, REA will add HOPPER_LAUNCHER_PATH using the launcher path reported by that installation." : " The HOPPER_LAUNCHER_PATH value shown above is the current fallback; if this plan installs Hopper, REA will replace it with the launcher path reported by that installation." : "";
			const persistence = registrationPersistenceDetail(client);
			return `Add the REA MCP registration for ${client.displayName ?? client.name}; preserve unrelated configuration. The backup path reflects the configuration inspected for this plan; if that file changes before execution, setup will select a recovery path for its current contents. Command: ${command.map((part) => JSON.stringify(part)).join(" ")}.${environmentDetail}${hopperDetail}${persistence === undefined ? "" : ` ${persistence}`}`;
		};
	})))();
}

//#endregion
//#region dist/application/Setup.js
var runSetup, runSetupWorkflow, installHopperAction, installSkillAction, setupFailure, emitProgress, manualClientsRemediation, combineRemediation, finalSetupRemediation, isSetupDecisionCancelled, setupCancelled, resolvedReadinessScope, summarizeDoctor, failureMessage;
function init_Setup() {
	return (init_Setup = __esmMin((() => {
		init_SupportedClients();
		init_SetupClients();
		init_SetupPlan();
		init_SetupHost();
		init_analysisErrorBase();
		init_SetupCleanupOwner();
		init_analysisErrorCleanup();
		runSetup = async (options, host = systemSetupHost(), confirm) => {
			let result;
			let primaryFailure;
			let threw = false;
			try {
				result = await runSetupWorkflow(options, host, confirm);
			} catch (cause) {
				threw = true;
				primaryFailure = cause;
			}
			let cleanup;
			try {
				const report = await host.close?.();
				cleanup = report === undefined ? undefined : setupCleanupError(report);
			} catch (cause) {
				cleanup = setupCleanupError(cause);
			}
			if (cleanup !== undefined && !cleanup.cleanupIncomplete) cleanup = undefined;
			if (threw) {
				if (cleanup === undefined) throw primaryFailure;
				if (primaryFailure instanceof AnalysisError) throw analysisErrorWithCleanupFailure(primaryFailure, cleanup, "setup").bindCleanupDependencies([primaryFailure, cleanup]);
				throw new AggregateError([primaryFailure, cleanup], "Setup and resource cleanup failed.", { cause: primaryFailure });
			}
			if (result === undefined) throw new Error("Setup returned no result.");
			if (cleanup === undefined) return result;
			const cleanupReason = setupCleanupReason(cleanup);
			const cleanupReport = {
				reason: cleanupReason,
				get resources() {
					return cleanup.cleanupResources;
				}
			};
			return {
				...result,
				status: "needs_human",
				code: result.code ?? "cleanup_failed",
				get cleanup() {
					return cleanup.cleanupIncomplete ? cleanupReport : undefined;
				},
				remediation: result.remediation ? `${result.remediation} ${cleanupReason}` : cleanupReason
			};
		};
		runSetupWorkflow = async (options, host, confirm) => {
			const appliedActions = [];
			let plannedActions = [];
			const clients = {};
			let clientStates = [];
			let readinessScope = options.readinessScope;
			const fail = (remediation) => setupFailure(remediation, [
				host,
				plannedActions,
				appliedActions,
				clients,
				clientStates
			], readinessScope);
			const failSkill = async (error) => ({
				...await fail(error.remediation),
				code: "skill_install_failed"
			});
			const unsupported = hostRemediation(host);
			if (unsupported !== undefined) return fail(unsupported);
			const initialState = await host.initialSetupState(options.readinessScope);
			let { hopperPath, providerEnvironment } = initialState;
			const discovery = await discoverSetupState({
				host,
				providerConfigured: initialState.providerConfigured,
				forceHopperInstall: options.installHopper,
				hopperLauncherConfigured: initialState.hopperLauncherConfigured === true,
				proposeHopper: options.proposeHopper ?? (confirm !== undefined && !options.structured),
				initialDoctor: initialState.doctor
			});
			clientStates = discovery.clientStates;
			const clientSelectionAllowed = options.clientIds === undefined && options.readinessScope?.clients === undefined && options.allDetectedClients !== true && options.installHopper !== true && options.skillClientIds === undefined && options.installSkill === undefined;
			const interactiveSelection = confirm !== undefined && !options.structured && clientSelectionAllowed;
			const requestedClientIds = options.clientIds ?? options.readinessScope?.clients;
			let selectedClientIds = [...new Set(options.allDetectedClients ? [...requestedClientIds ?? [], ...discovery.detectedClientIds] : requestedClientIds ?? discovery.defaultClientIds)];
			let selectedSkillClientIds = options.skillClientIds ?? options.readinessScope?.skillClients ?? selectedClientIds;
			let skillNeedsInstall = await host.skillNeedsInstall(selectedSkillClientIds);
			let skillSelected = options.installSkill === true || options.installSkill !== false && (selectedClientIds.length > 0 || selectedSkillClientIds.length > 0);
			let installSkill = skillSelected && skillNeedsInstall;
			let planDiscovery = discovery;
			if (interactiveSelection) {
				const selectionSkillClientIds = [];
				const offerSkillAction = options.installSkill !== false;
				const selectionActions = await planSetupActions({
					discovery,
					host,
					providerEnvironment,
					command: host.registrationCommand,
					clientIds: [],
					skillClientIds: selectionSkillClientIds,
					installSkill: offerSkillAction
				});
				const decision = await confirm(selectionActions.plannedActions, {
					stage: "select",
					clientStates,
					selectedClientIds: discovery.defaultClientIds,
					clientSelectionAllowed
				});
				if (isSetupDecisionCancelled(decision)) return setupCancelled(selectionActions.plannedActions, clients, clientStates, discovery.initialDoctor);
				const selectedActionIds = new Set(typeof decision === "boolean" ? decision ? [...selectionActions.plannedActions.map(({ id }) => id), ...discovery.defaultClientIds.map((id) => `configure_client:${id}`)] : [] : decision.selectedActionIds);
				selectedClientIds = [...selectedActionIds].filter((id) => id.startsWith("configure_client:")).map((id) => id.slice("configure_client:".length));
				skillNeedsInstall = await host.skillNeedsInstall(selectedClientIds);
				const proposedInstallAction = selectionActions.plannedActions.some(({ id }) => id === "install_hopper");
				planDiscovery = {
					...discovery,
					installHopper: options.installHopper || proposedInstallAction && selectedActionIds.has("install_hopper")
				};
				const skillActionSelected = selectionActions.plannedActions.some(({ id, kind }) => kind === "install_skill" && selectedActionIds.has(id));
				skillSelected = options.installSkill === true || skillActionSelected && selectedClientIds.length === 0 || options.installSkill !== false && selectedClientIds.length > 0;
				installSkill = skillSelected && skillNeedsInstall;
				selectedSkillClientIds = selectedClientIds;
			}
			const planned = await planSetupActions({
				discovery: planDiscovery,
				host,
				providerEnvironment,
				command: host.registrationCommand,
				clientIds: selectedClientIds,
				skillClientIds: selectedSkillClientIds,
				installSkill
			});
			plannedActions = planned.plannedActions;
			if (planned.blocker !== undefined) return fail(planned.blocker);
			const hopperRefusal = hopperInstallRefusal(planDiscovery);
			if (hopperRefusal !== undefined) return fail(hopperRefusal);
			const planSelection = {
				installHopper: planDiscovery.installHopper,
				installSkill,
				skillSelected,
				selectedSkillClientIds,
				selectedClients: planned.selectedClients,
				clientsToConfigure: planned.clientsToConfigure
			};
			readinessScope = resolvedReadinessScope(options.readinessScope, planSelection);
			const manualRemediation = manualClientsRemediation(planned.selectedClients);
			if (skillSelected) {
				const admission = await host.validateSkillDirectories(selectedSkillClientIds);
				if (!admission.ok) return failSkill(admission.error);
			}
			if (options.dryRun === true) return {
				status: "planned",
				plannedActions,
				appliedActions,
				clients,
				doctor: summarizeDoctor(discovery.initialDoctor),
				clientStates,
				...manualRemediation === undefined ? {} : { remediation: manualRemediation }
			};
			let approved = options.approved || plannedActions.length === 0;
			let interactiveApproval = false;
			if (!approved && confirm !== undefined && !options.structured) {
				const decision = await confirm?.(plannedActions, {
					stage: "confirm",
					clientStates,
					selectedClientIds,
					clientSelectionAllowed: false
				});
				if (decision !== undefined) {
					if (isSetupDecisionCancelled(decision)) return setupCancelled(plannedActions, clients, clientStates, discovery.initialDoctor);
					approved = typeof decision === "boolean" ? decision : decision.approved;
					interactiveApproval = approved;
				}
			}
			if (!approved) return {
				status: confirm === undefined ? "needs_confirmation" : "cancelled",
				plannedActions,
				appliedActions,
				clients,
				doctor: summarizeDoctor(discovery.initialDoctor),
				clientStates,
				...confirm === undefined ? { remediation: "Review the setup plan, then rerun interactively or with --yes." } : {}
			};
			if (planSelection.skillSelected) {
				const admission = await host.validateSkillDirectories(selectedSkillClientIds);
				if (!admission.ok) return failSkill(admission.error);
			}
			let selectedClients = planSelection.clientsToConfigure;
			let hopperWarning;
			let hopperFailure;
			if (planSelection.installHopper && (interactiveApproval || options.installHopper)) {
				const install = await installHopperAction({
					host,
					options,
					appliedActions,
					selectedClients,
					providerEnvironment
				});
				if ("failure" in install) hopperFailure = install.failure;
				else ({hopperPath, providerEnvironment, selectedClients, warning: hopperWarning} = install);
			}
			const clientFailure = await configureDetectedClients({
				host,
				detectedClients: selectedClients,
				providerEnvironment,
				command: host.registrationCommand,
				clients,
				appliedActions,
				...options.onProgress === undefined ? {} : { onProgress: options.onProgress }
			});
			const withHopperFailure = (result) => hopperFailure === undefined ? result : {
				...result,
				code: result.code ?? hopperFailure.code,
				remediation: combineRemediation(hopperFailure.remediation, result.remediation) ?? hopperFailure.remediation
			};
			if (clientFailure !== undefined) return withHopperFailure(await fail(clientFailure));
			if (planSelection.installSkill) {
				const skillFailure = await installSkillAction(host, options, appliedActions, selectedSkillClientIds);
				if (skillFailure !== undefined) {
					return withHopperFailure(await failSkill(skillFailure));
				}
			}
			const prewarmEligible = appliedActions.some((id) => id.startsWith("configured_"));
			let prewarm;
			if (prewarmEligible && host.prewarmRegistrationRunner !== undefined) {
				emitProgress(options, {
					actionId: "prewarm_registration_runner",
					label: "REA package-runner cache",
					state: "started",
					detail: "Preparing the pinned package entry"
				});
				prewarm = await host.prewarmRegistrationRunner();
				if (prewarm.status === "failed") emitProgress(options, {
					actionId: "prewarm_registration_runner",
					label: "REA package-runner cache",
					state: "warning",
					detail: prewarm.reason
				});
				else if (prewarm.status === "warmed") emitProgress(options, {
					actionId: "prewarm_registration_runner",
					label: "REA package-runner cache",
					state: "completed"
				});
			}
			const doctor = summarizeDoctor(await host.doctor(readinessScope));
			const remediation = combineRemediation(hopperFailure?.remediation ?? finalSetupRemediation(host.platform, appliedActions.includes("installed_hopper"), doctor.healthy, hopperPath === undefined && planDiscovery.hopperInstall.supported), hopperWarning, manualRemediation);
			return {
				status: remediation === undefined ? "ready" : "needs_human",
				plannedActions,
				appliedActions,
				clients,
				doctor,
				clientStates,
				...remediation === undefined ? {} : { remediation },
				...hopperFailure === undefined ? {} : { code: hopperFailure.code },
				...prewarm === undefined ? {} : { prewarm }
			};
		};
		installHopperAction = async (input) => {
			const label = "Hopper deep-analysis provider";
			emitProgress(input.options, {
				actionId: "install_hopper",
				label,
				state: "started"
			});
			const installed = await input.host.installHopper(input.options.installHopper);
			if (installed.status === "failed") {
				emitProgress(input.options, {
					actionId: "install_hopper",
					label,
					state: "failed",
					detail: installed.remediation
				});
				return { failure: installed };
			}
			input.appliedActions.push("installed_hopper");
			const warning = [installed.warning, installed.cleanupFailure].filter((value) => value !== undefined).join(" ");
			emitProgress(input.options, {
				actionId: "install_hopper",
				label,
				state: warning === "" ? "completed" : "warning",
				detail: warning === "" ? installed.launcherPath : `${installed.launcherPath}; ${warning}`
			});
			const providerEnvironment = {
				...input.providerEnvironment,
				HOPPER_LAUNCHER_PATH: installed.launcherPath
			};
			return {
				hopperPath: installed.launcherPath,
				providerEnvironment,
				...warning === "" ? {} : { warning },
				selectedClients: await filterClientsNeedingConfigure(input.host, input.selectedClients, providerEnvironment, input.host.registrationCommand)
			};
		};
		installSkillAction = async (host, options, appliedActions, skillClientIds) => {
			const label = "REA reverse-engineering skill";
			emitProgress(options, {
				actionId: "install_skill",
				label,
				state: "started"
			});
			const skill = await host.installSkill(skillClientIds);
			if (!skill.ok) {
				emitProgress(options, {
					actionId: "install_skill",
					label,
					state: "failed",
					detail: skill.error.message
				});
				return skill.error;
			}
			if (skill.value === "installed") appliedActions.push("installed_skill");
			emitProgress(options, {
				actionId: "install_skill",
				label,
				state: skill.value === "installed" ? "completed" : "warning",
				...skill.value === "unchanged" ? { detail: "Already current" } : {}
			});
			return undefined;
		};
		setupFailure = async (remediation, [host, plannedActions, appliedActions, clients, clientStates], scope) => {
			return {
				status: "needs_human",
				plannedActions,
				appliedActions,
				clients,
				doctor: summarizeDoctor(await host.doctor(scope)),
				clientStates,
				remediation
			};
		};
		emitProgress = (options, event) => options.onProgress?.(event);
		manualClientsRemediation = (clients) => clients.map((client) => manualRegistrationRemediation(client.name)).find((remediation) => remediation !== undefined);
		combineRemediation = (...parts) => {
			const present = parts.filter((part) => part !== undefined && part !== "");
			return present.length === 0 ? undefined : present.join(" ");
		};
		finalSetupRemediation = (platform, installedHopper, healthy, offerHopperInstall) => {
			if (platform === "darwin" && installedHopper) return "Open Hopper, choose its demo mode or activate a license, then rerun rea doctor --json.";
			if (healthy) return undefined;
			return offerHopperInstall ? "Hopper is optional for non-Hopper providers. Rerun with --yes --install-hopper for deep native analysis." : "Run rea doctor and apply each reported remediation.";
		};
		isSetupDecisionCancelled = (decision) => typeof decision === "boolean" ? !decision : decision.cancelled === true;
		setupCancelled = (plannedActions, clients, clientStates, doctor) => ({
			status: "cancelled",
			plannedActions,
			appliedActions: [],
			clients,
			doctor: summarizeDoctor(doctor),
			clientStates
		});
		resolvedReadinessScope = (requested, selection) => ({
			clients: selection.selectedClients.map(({ name }) => name),
			providers: selection.installHopper ? ["hopper"] : requested?.providers ?? [],
			skill: selection.skillSelected === true || requested?.skill === true,
			...selection.skillSelected === true || requested?.skill === true ? { skillClients: selection.selectedSkillClientIds } : {}
		});
		summarizeDoctor = (report) => ({
			healthy: report.healthy,
			environment_healthy: report.environment_healthy,
			scope: report.scope,
			availableProviders: [...report.hopperPath !== undefined && report.checks.filter(({ name }) => name.startsWith("hopper")).every(({ ok }) => ok) ? ["hopper"] : [], ...(report.providerInspections ?? []).filter(({ available, checks }) => available && checks.every(({ ok }) => ok)).map(({ id }) => id)],
			...report.hopperPath === undefined ? {} : { hopperPath: report.hopperPath },
			...report.providerInspections === undefined ? {} : { providerInspections: report.providerInspections },
			...report.identity === undefined ? {} : { identity: {
				skill: report.identity.skill,
				registrations: report.identity.registrations
			} }
		});
		failureMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
	})))();
}

//#endregion
init_Setup();
export { runSetup };
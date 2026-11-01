import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { f as init_analysisErrorCore, i as AnalysisCancelledError } from "./analysisErrorCore-Cl6H9zyu.js";
import { i as localPathStringSchema, n as init_localPath, t as absoluteLocalPathStringSchema } from "./localPath-BCKW5wEI.js";
import { n as init_digests, t as digestSchema } from "./digests-CzeqVG1r.js";
import { z } from "zod";

//#region dist/domain/apple/machoCpuIdentity.js
var CPU_SUBTYPE_CAPABILITY_MASK, machoCpuSubtypeBase, machoArchitectureName, machoArchitectureFamily;
function init_machoCpuIdentity() {
	return (init_machoCpuIdentity = __esmMin((() => {
		CPU_SUBTYPE_CAPABILITY_MASK = 4278190080;
		machoCpuSubtypeBase = (cpuSubtype) => cpuSubtype & ~CPU_SUBTYPE_CAPABILITY_MASK;
		machoArchitectureName = (cpuType, cpuSubtype) => {
			const subtype = machoCpuSubtypeBase(cpuSubtype);
			if (cpuType === 16777228) {
				if (subtype === 12) return "arm64e.x1";
				if (subtype === 2) return "arm64e";
				if (subtype === 1) return "arm64v8";
				return "arm64";
			}
			if (cpuType === 33554444) return "arm64_32";
			if (cpuType === 16777223) return subtype === 8 ? "x86_64h" : "x86_64";
			if (cpuType === 7) return "i386";
			if (cpuType === 12) return "arm";
			return `cpu-${cpuType.toString(16)}`;
		};
		machoArchitectureFamily = (architecture) => {
			if (architecture === "arm64e.x1") return "arm64e";
			if (architecture === "arm64v8") return "arm64";
			return architecture;
		};
	})))();
}

//#endregion
//#region dist/domain/apple/dyldPaths.js
var MAX_SYMLINK_HOPS, resolveTreePath, segmentsOf, directoryOf, joinPath, expandPrefix, COMPATIBLE_ARCHITECTURES, ARM32_CPU_TYPE, ARM32_SUBTYPE_PREFERENCES, compatibleSlice;
function init_dyldPaths() {
	return (init_dyldPaths = __esmMin((() => {
		init_machoCpuIdentity();
		MAX_SYMLINK_HOPS = 32;
		resolveTreePath = async (view, input) => {
			const pending = segmentsOf(input);
			const resolved = [];
			let last;
			let hops = 0;
			while (pending.length > 0) {
				const segment = pending.shift() ?? "";
				if (segment === ".") continue;
				if (segment === "..") {
					if (resolved.length === 0) return { kind: "escapes" };
					resolved.pop();
					last = { kind: "directory" };
					continue;
				}
				const path = [...resolved, segment].join("/");
				const entry = await view.entry(path);
				if (entry === undefined) return { kind: "absent" };
				if (entry.kind === "symlink") {
					hops += 1;
					if (hops > MAX_SYMLINK_HOPS) return { kind: "absent" };
					if (entry.target.startsWith("/")) return { kind: "escapes" };
					pending.unshift(...segmentsOf(entry.target));
					continue;
				}
				if (entry.kind === "file" && pending.length > 0) return { kind: "absent" };
				resolved.push(segment);
				last = entry;
			}
			return last?.kind === "file" ? {
				kind: "file",
				path: resolved.join("/")
			} : { kind: "not-file" };
		};
		segmentsOf = (path) => {
			const segments = path.split("/").filter((segment) => segment !== "");
			if (path.endsWith("/")) segments.push(".");
			return segments;
		};
		directoryOf = (path) => {
			const index = path.lastIndexOf("/");
			return index < 0 ? "" : path.slice(0, index);
		};
		joinPath = (directory, rest) => directory === "" ? rest : rest === "" ? directory : `${directory}/${rest}`;
		expandPrefix = (raw, context) => {
			const variable = /^@(executable_path|loader_path)(?:\/(.*))?$/su.exec(raw);
			if (variable !== null) {
				const rest = variable[2] ?? "";
				if (variable[1] === "loader_path") return {
					scope: "target",
					path: joinPath(context.ownerDirectory, rest)
				};
				return context.executable === null ? {
					scope: "undetermined",
					path: raw
				} : {
					scope: "target",
					path: joinPath(directoryOf(context.executable), rest)
				};
			}
			if (raw.startsWith("/")) {
				const lookupPath = context.rootRelativePath(raw);
				return lookupPath === undefined ? {
					scope: "outside",
					path: raw
				} : {
					scope: "target",
					path: raw,
					lookupPath
				};
			}
			return {
				scope: "undetermined",
				path: raw
			};
		};
		COMPATIBLE_ARCHITECTURES = { x86_64h: ["x86_64h", "x86_64"] };
		ARM32_CPU_TYPE = 12;
		ARM32_SUBTYPE_PREFERENCES = {
			0: [0],
			5: [5, 0],
			6: [
				6,
				7,
				5,
				0
			],
			7: [
				7,
				5,
				0
			],
			8: [
				8,
				7,
				5,
				0
			],
			9: [
				9,
				6,
				7,
				5,
				0
			],
			10: [
				10,
				9,
				6,
				7,
				5,
				0
			],
			11: [
				11,
				9,
				10,
				6,
				7,
				5,
				0
			],
			12: [12]
		};
		compatibleSlice = (slices, process) => {
			if (process.cpu_type === ARM32_CPU_TYPE) {
				const subtype = machoCpuSubtypeBase(process.cpu_subtype);
				const preferences = ARM32_SUBTYPE_PREFERENCES[subtype];
				if (preferences === undefined) return slices.some((item) => item.cpu_type === ARM32_CPU_TYPE) ? { kind: "unknown" } : { kind: "missing" };
				for (const preferredSubtype of preferences) {
					const slice = slices.find((item) => item.cpu_type === ARM32_CPU_TYPE && machoCpuSubtypeBase(item.cpu_subtype) === preferredSubtype);
					if (slice !== undefined) return {
						kind: "selected",
						slice
					};
				}
				return { kind: "missing" };
			}
			const processFamily = machoArchitectureFamily(process.architecture);
			for (const architecture of COMPATIBLE_ARCHITECTURES[processFamily] ?? [processFamily]) {
				const slice = slices.find((item) => machoArchitectureFamily(item.architecture) === architecture && (processFamily !== "arm64e" || item.cpu_type === process.cpu_type && machoCpuSubtypeBase(item.cpu_subtype) === machoCpuSubtypeBase(process.cpu_subtype)));
				if (slice !== undefined) return {
					kind: "selected",
					slice
				};
			}
			return { kind: "missing" };
		};
	})))();
}

//#endregion
//#region dist/domain/apple/dyldEnvironment.js
var embeddedDyldOverrides, overrideEffect, isFrameworkInstallName, hasApplicableDyldOverrides;
function init_dyldEnvironment() {
	return (init_dyldEnvironment = __esmMin((() => {
		embeddedDyldOverrides = (environment, platforms) => {
			const overrides = [];
			for (const setting of environment) {
				const delimiter = setting.indexOf("=");
				if (delimiter <= 0) continue;
				const variable = setting.slice(0, delimiter);
				const value = setting.slice(delimiter + 1);
				const effect = overrideEffect(variable, value);
				if (effect === undefined) continue;
				if (variable === "DYLD_ROOT_PATH" && platforms.length > 0 && platforms.every((platform) => platform >= 1 && platform <= 12) && !platforms.some((platform) => [
					7,
					8,
					9,
					12
				].includes(platform))) continue;
				overrides.push({
					variable,
					value,
					...effect
				});
			}
			return overrides;
		};
		overrideEffect = (variable, value) => {
			switch (variable) {
				case "DYLD_LIBRARY_PATH": return {
					phase: "override",
					scope: "library"
				};
				case "DYLD_FRAMEWORK_PATH": return {
					phase: "override",
					scope: "framework"
				};
				case "DYLD_FALLBACK_LIBRARY_PATH": return {
					phase: "fallback",
					scope: "library"
				};
				case "DYLD_FALLBACK_FRAMEWORK_PATH": return {
					phase: "fallback",
					scope: "framework"
				};
				case "DYLD_VERSIONED_LIBRARY_PATH":
				case "DYLD_VERSIONED_FRAMEWORK_PATH":
				case "DYLD_IMAGE_SUFFIX": return /[^:]/u.test(value) ? {
					phase: "override",
					scope: "all"
				} : undefined;
				case "DYLD_INSERT_LIBRARIES": return value === "" ? undefined : {
					phase: "override",
					scope: "all"
				};
				case "DYLD_ROOT_PATH":
				case "DYLD_OVERLAY_PATH": return value === "" ? undefined : {
					phase: "override",
					scope: "prefix"
				};
				default: return undefined;
			}
		};
		isFrameworkInstallName = (name, overrides) => {
			const separator = name.lastIndexOf(".framework/");
			if (separator < 0) return false;
			const framework = name.slice(0, separator).split("/").at(-1);
			const leaf = name.slice(name.lastIndexOf("/") + 1);
			return leaf === framework || overrides.some(({ variable, value }) => variable === "DYLD_IMAGE_SUFFIX" && leaf === `${framework}${value}`);
		};
		hasApplicableDyldOverrides = (overrides, installName, ordinarySearchFoundImage) => {
			const kind = isFrameworkInstallName(installName, overrides) ? "framework" : "library";
			return overrides.some(({ phase, scope }) => (phase === "override" || !ordinarySearchFoundImage) && (scope === "all" || scope === kind || scope === "prefix" && !installName.startsWith("@")));
		};
	})))();
}

//#endregion
//#region dist/domain/apple/dylibResolutionFindings.js
var isLazyLoadCommand, deriveFindings, unresolvedFinding, missingCandidateExplanation, candidateRejection, dependencyPhrase, lazyConsequence, DYLIB_RESOLUTION_LIMITATIONS;
function init_dylibResolutionFindings() {
	return (init_dylibResolutionFindings = __esmMin((() => {
		isLazyLoadCommand = (command) => command === "LC_LAZY_LOAD_DYLIB" || command === "LC_LAZY_LOAD_DYLIB_INFO";
		deriveFindings = (edges, roots) => {
			const findings = [];
			edges.forEach((edge, index) => {
				if (edge.resolution.status === "unresolved") findings.push(unresolvedFinding(edge, index));
				const resolvedAt = edge.candidates.findIndex(({ outcome }) => outcome === "resolved");
				const earlier = edge.candidates.slice(0, Math.max(resolvedAt, 0)).filter(({ source, outcome }) => source === "rpath" && outcome === "absent").map(({ path }) => path);
				if (resolvedAt > 0 && earlier.length > 0) findings.push({
					kind: "earlier-rpath-candidate-absent",
					edge_index: index,
					image: edge.loader,
					basis: "derived",
					explanation: `The modeled dyld search checks ${earlier.join(", ")} before ${edge.resolution.image ?? edge.install_name}. A compatible Mach-O placed at an earlier modeled path could take precedence over that fallback, subject to unmodeled search inputs and code-signing library validation; library validation is not evaluated here (see inspect_signature).${edge.loader_conditional ? " This loader loads only conditionally; if it never loads, this search never occurs." : ""}${edge.resolution.status === "conditional" ? " Unmodeled environment overrides or earlier unknown candidates may take precedence; placing an image at this rpath does not establish which image dyld will load." : ""}`
				});
			});
			for (const { image, slice } of roots) {
				const { architecture } = slice;
				const environment = slice.dyld_environment;
				if (environment.length > 0) findings.push({
					kind: "dyld-environment-present",
					edge_index: null,
					image,
					basis: "derived",
					explanation: slice.file_type === "execute" ? `${image} (${architecture}) sets dyld environment variables through LC_DYLD_ENVIRONMENT (${environment.join(", ")}); any image-selection overrides they request are not modeled. Diagnostic settings alone do not alter resolution.` : `${image} (${architecture}) contains LC_DYLD_ENVIRONMENT (${environment.join(", ")}). Dyld reads these commands only from the main executable; entries in this non-executable root are observations and do not alter resolution.`
				});
			}
			return findings;
		};
		unresolvedFinding = (edge, index) => {
			const base = {
				edge_index: index,
				image: edge.loader,
				basis: "derived"
			};
			const lazy = isLazyLoadCommand(edge.command);
			const missing = missingCandidateExplanation(edge, dependencyPhrase(edge, lazy));
			const when = edge.loader_conditional ? `. ${edge.loader} loads only conditionally; if it loads, ` : "; ";
			if (lazy) return {
				...base,
				kind: "lazy-load-unresolved",
				explanation: `${missing}${when}${lazyConsequence(edge.weak)}`
			};
			return edge.weak ? {
				...base,
				kind: "weak-load-unresolved",
				explanation: `${missing}${when}dyld continues without it.`
			} : {
				...base,
				kind: "required-load-unresolved",
				explanation: `${missing}${when}dyld would fail to load this required dependency for ${edge.root} (${edge.architecture}) unless the image is supplied elsewhere.`
			};
		};
		missingCandidateExplanation = (edge, dependency) => {
			const present = edge.candidates.flatMap(({ outcome, resolved_path }) => resolved_path === null ? [] : [{
				outcome,
				path: resolved_path
			}]);
			if (present.length === 0) return `No candidate for ${dependency} exists in the analyzed root`;
			const descriptions = present.map(({ outcome, path }) => `${path} (${candidateRejection(outcome)})`);
			return `No usable candidate for ${dependency} exists in the analyzed root; found ${descriptions.join(", ")}`;
		};
		candidateRejection = (outcome) => {
			switch (outcome) {
				case "not-mach-o": return "not a Mach-O image";
				case "malformed": return "malformed";
				case "architecture-missing": return "missing the process architecture";
				case "not-loadable": return "not a loadable dylib";
				case "platform-mismatch": return "incompatible with the process platform";
				case "unsupported": return "unsupported by the parser";
				case "resolved": return "loadable";
				case "absent": return "absent";
				case "outside-target": return "outside the analyzed root";
				case "escapes-target": return "escapes the analyzed root";
				case "undetermined": return "of undetermined loadability";
			}
		};
		dependencyPhrase = (edge, lazy) => {
			if (lazy && edge.weak) return `lazily loaded weak dependency ${edge.install_name}`;
			if (lazy) return `lazily loaded ${edge.install_name}`;
			if (edge.weak) return `weak dependency ${edge.install_name}`;
			return edge.install_name;
		};
		lazyConsequence = (weak) => weak ? "dyld loads it on first use and continues if it is absent." : "dyld loads it on first use, which would fail unless the image is supplied elsewhere.";
		DYLIB_RESOLUTION_LIMITATIONS = [
			"LC_LAZY_LOAD_DYLIB and LC_LAZY_LOAD_DYLIB_INFO dependencies are resolved but not traversed, because dyld loads them only on first use.",
			"Slices are matched by dyld's graded architectures (an x86_64h process also loads x86_64). arm64e processes that disable pointer authentication can also load arm64 slices; that fallback is not modeled.",
			"Absolute install names and rpaths are outside the analyzed root and are not evaluated, including /System and /usr/lib libraries that the dyld shared cache usually provides.",
			"Leaf and relative install names depend on dyld fallback paths, DYLD_* variables, and the working directory; they are undetermined.",
			"Load order follows dyld's dependents-first traversal in load-command order. An image reached through several chains is resolved once per process, with the rpath stack and conditionality of the first chain; a later @rpath request whose install name matches an already loaded image reuses it.",
			"@loader_path uses each image's symlink-resolved path within the analyzed root.",
			"Code-signing checks that can reject a found image, such as library validation and the hardened runtime, are not evaluated.",
			"Dylib compatibility versions are not compared. Apple's linker documentation describes a load-time rejection when an image's compatibility version is older than the loader requires, but dyld on macOS 26 was observed to load such an image."
		];
	})))();
}

//#endregion
//#region dist/domain/apple/dylibResolution.js
var ROOT_RELATIVE_PATH, rootRelativePathSchema, dylibResolutionInputSchema, dependencyCommandSchema, IMPLICIT_MACOS_PLATFORM, MACOS_DYLD_IMPLICIT_PLATFORM_CPU_TYPES, dependencySchema, machoSliceSchema, machoImageSlices, candidateSchema, edgeSchema, findingSchema, imageSchema, dylibResolutionResultSchema, expandCandidatePath, appendRpath, candidateTemplates, evaluateCandidate, platformLoadability, imageLoadabilityForPlatform, isKnownPlatform, imageFacts, resolution, resolveDependency, traceProcess, projectTraceResult, traceDylibLoading, withoutDependencies, compare;
function init_dylibResolution() {
	return (init_dylibResolution = __esmMin((() => {
		init_machoCpuIdentity();
		init_analysisErrorCore();
		init_dyldPaths();
		init_digests();
		init_dyldEnvironment();
		init_dylibResolutionFindings();
		ROOT_RELATIVE_PATH = /^(?:[^\x2f\\\x00.][^\x2f\\\x00]*|\.[^\x2f\\\x00.][^\x2f\\\x00]*|\.\.[^\x2f\\\x00]+)(?:\x2f(?:[^\x2f\\\x00.][^\x2f\\\x00]*|\.[^\x2f\\\x00.][^\x2f\\\x00]*|\.\.[^\x2f\\\x00]+))*$/u;
		rootRelativePathSchema = z.string().min(1).regex(ROOT_RELATIVE_PATH, "Use a normalized path relative to the analyzed root, without a leading or trailing '/', '//', or '.' and '..' segments");
		dylibResolutionInputSchema = z.strictObject({
			roots: z.array(rootRelativePathSchema).min(1).optional(),
			architecture: z.enum([
				"arm64",
				"arm64e",
				"x86_64"
			]).optional()
		});
		dependencyCommandSchema = z.enum([
			"LC_LOAD_DYLIB",
			"LC_LOAD_WEAK_DYLIB",
			"LC_REEXPORT_DYLIB",
			"LC_LAZY_LOAD_DYLIB",
			"LC_LAZY_LOAD_DYLIB_INFO",
			"LC_LOAD_UPWARD_DYLIB"
		]);
		IMPLICIT_MACOS_PLATFORM = 1;
		MACOS_DYLD_IMPLICIT_PLATFORM_CPU_TYPES = new Set([
			7,
			16777223,
			16777228
		]);
		dependencySchema = z.strictObject({
			command: dependencyCommandSchema,
			encoding: z.enum([
				"dylib_command",
				"dylib_use_command",
				"lazy_load_dylib_info"
			]),
			install_name: z.string(),
			weak: z.boolean(),
			upward: z.boolean(),
			reexport: z.boolean(),
			delayed_init: z.boolean(),
			/**
			* Null for `lazy_load_dylib_info`: that payload has no version fields.
			* Classic dylib commands still carry both versions.
			*/
			current_version: z.string().nullable(),
			compatibility_version: z.string().nullable()
		});
		machoSliceSchema = z.strictObject({
			architecture: z.string().min(1),
			hidden: z.boolean().exactOptional(),
			/** Physical identity observed in the thin header and, for FAT, its table. */
			slice_offset: z.int().nonnegative(),
			slice_size: z.int().positive(),
			cpu_type: z.int().nonnegative(),
			cpu_subtype: z.int().nonnegative(),
			fat_cpu_type: z.int().nonnegative().nullable(),
			fat_cpu_subtype: z.int().nonnegative().nullable(),
			fat_alignment_exponent: z.int().nonnegative().nullable(),
			file_type: z.enum([
				"execute",
				"dylib",
				"bundle",
				"other"
			]),
			file_type_code: z.int().nonnegative(),
			/** Raw LC_BUILD_VERSION platform number; null means no such command was observed. */
			platform: z.int().nonnegative().nullable(),
			/** Every distinct build platform declared by LC_BUILD_VERSION/version-min commands. */
			platforms: z.array(z.int().nonnegative()),
			install_name: z.string().nullable(),
			dependencies: z.array(dependencySchema),
			rpaths: z.array(z.string()),
			dyld_environment: z.array(z.string()),
			code_signature_present: z.boolean()
		});
		machoImageSlices = (facts) => facts.hiddenSlices === undefined ? facts.slices : [...facts.slices, ...facts.hiddenSlices];
		candidateSchema = z.strictObject({
			path: z.string(),
			source: z.enum([
				"literal",
				"executable_path",
				"loader_path",
				"rpath",
				"already-loaded"
			]),
			rpath: z.string().nullable(),
			rpath_owner: z.string().nullable(),
			outcome: z.enum([
				"resolved",
				"absent",
				"not-mach-o",
				"malformed",
				"unsupported",
				"architecture-missing",
				"not-loadable",
				"platform-mismatch",
				"outside-target",
				"escapes-target",
				"undetermined"
			]),
			resolved_path: z.string().nullable(),
			platform_basis: z.enum(["macos-dyld-implicit"]).optional()
		});
		edgeSchema = z.strictObject({
			root: z.string(),
			architecture: z.string(),
			loader: z.string(),
			via: z.array(z.string()),
			...dependencySchema.shape,
			candidates: z.array(candidateSchema),
			resolution: z.strictObject({
				status: z.enum([
					"resolved",
					"conditional",
					"unresolved",
					"undetermined"
				]),
				image: z.string().nullable()
			}),
			install_name_matches: z.boolean().nullable(),
			/**
			* The loader was reached through a conditional edge, so it might not load;
			* this edge describes what happens only if it does.
			*/
			loader_conditional: z.boolean()
		});
		findingSchema = z.strictObject({
			kind: z.enum([
				"required-load-unresolved",
				"weak-load-unresolved",
				"lazy-load-unresolved",
				"earlier-rpath-candidate-absent",
				"dyld-environment-present"
			]),
			edge_index: z.int().nonnegative().nullable(),
			image: z.string().nullable(),
			basis: z.literal("derived"),
			explanation: z.string().min(1)
		});
		imageSchema = z.strictObject({
			path: z.string(),
			sha256: digestSchema,
			parse_status: z.enum([
				"parsed",
				"malformed",
				"unsupported"
			]),
			reason: z.string().nullable(),
			slices: z.array(machoSliceSchema.omit({ dependencies: true }))
		});
		dylibResolutionResultSchema = z.strictObject({
			root_path: z.string(),
			target_sha256: digestSchema,
			roots: z.array(z.strictObject({
				image: z.string(),
				architecture: z.string()
			})),
			images: z.array(imageSchema),
			edges: z.array(edgeSchema),
			findings: z.array(findingSchema),
			coverage: z.strictObject({
				status: z.enum(["complete", "partial"]),
				unparsed_images: z.array(z.string()),
				roots_without_architecture: z.array(z.string())
			}),
			limitations: z.array(z.string().min(1))
		});
		expandCandidatePath = (raw, ownerDirectory, context) => expandPrefix(raw, {
			ownerDirectory,
			executable: context.executable,
			rootRelativePath: (absolutePath) => context.view.rootRelativePath(absolutePath)
		});
		appendRpath = (base, rest) => {
			if (base === "") return rest;
			if (base === "/") return `/${rest}`;
			return `${base.replace(/\/+$/u, "")}/${rest}`;
		};
		candidateTemplates = (dependency, loader, context) => {
			const name = dependency.install_name;
			if (!name.startsWith("@rpath/")) {
				const source = name.startsWith("@executable_path") ? "executable_path" : name.startsWith("@loader_path") ? "loader_path" : "literal";
				return [{
					expansion: expandCandidatePath(name, directoryOf(loader), context),
					source,
					rpath: null,
					rpathOwner: null
				}];
			}
			const rest = name.slice("@rpath/".length);
			const owners = [...context.loaded.get(loader)?.chain ?? [loader]].reverse();
			return owners.flatMap((owner) => (context.loaded.get(owner)?.slice.rpaths ?? []).map((rpath) => {
				const base = expandCandidatePath(rpath, directoryOf(owner), context);
				const lookupPath = base.scope === "target" ? base.lookupPath : undefined;
				const expansion = {
					scope: base.scope,
					path: base.scope === "outside" || lookupPath !== undefined ? appendRpath(base.path, rest) : `${base.path}${base.path === "" ? "" : "/"}${rest}`,
					...lookupPath === undefined ? {} : { lookupPath: appendRpath(lookupPath, rest) }
				};
				return {
					expansion,
					source: "rpath",
					rpath,
					rpathOwner: owner
				};
			}));
		};
		evaluateCandidate = async (template, context) => {
			const base = {
				path: template.expansion.path,
				source: template.source,
				rpath: template.rpath,
				rpath_owner: template.rpathOwner
			};
			if (template.expansion.scope === "outside") return {
				...base,
				outcome: "outside-target",
				resolved_path: null
			};
			if (template.expansion.scope === "undetermined") return {
				...base,
				outcome: "undetermined",
				resolved_path: null
			};
			const lookup = await resolveTreePath(context.view, template.expansion.lookupPath ?? template.expansion.path);
			if (lookup.kind === "escapes") return {
				...base,
				outcome: "escapes-target",
				resolved_path: null
			};
			if (lookup.kind !== "file") return {
				...base,
				outcome: "absent",
				resolved_path: null
			};
			const facts = await imageFacts(context, lookup.path);
			let outcome;
			if (facts.status !== "parsed") outcome = facts.status;
			else {
				const selection = compatibleSlice(machoImageSlices(facts), context.processIdentity);
				if (selection.kind === "unknown") outcome = "undetermined";
				else if (selection.kind === "missing") outcome = "architecture-missing";
				else if (selection.slice.file_type_code !== 6) outcome = "not-loadable";
				else {
					const { slice } = selection;
					const platformResult = platformLoadability(context, slice);
					outcome = platformResult.outcome === "compatible" ? "resolved" : platformResult.outcome === "incompatible" ? "platform-mismatch" : "undetermined";
					if (outcome === "undetermined") context.unknownPlatformCandidates.add(lookup.path);
					if (platformResult.basis !== undefined) {
						context.implicitMacOSPlatformCandidates.add(lookup.path);
						return {
							...base,
							outcome,
							resolved_path: lookup.path,
							platform_basis: platformResult.basis
						};
					}
				}
			}
			return {
				...base,
				outcome,
				resolved_path: lookup.path
			};
		};
		platformLoadability = (context, image) => {
			const { platforms: processPlatforms } = context;
			const { file_type_code: fileType, platforms: imagePlatforms } = image;
			let effectiveImagePlatforms = imagePlatforms;
			let basis;
			if (imagePlatforms.length === 0) {
				if (context.executable !== null && processPlatforms.length === 1 && processPlatforms[0] === IMPLICIT_MACOS_PLATFORM && MACOS_DYLD_IMPLICIT_PLATFORM_CPU_TYPES.has(image.cpu_type)) {
					effectiveImagePlatforms = [IMPLICIT_MACOS_PLATFORM];
					basis = "macos-dyld-implicit";
				} else return { outcome: "unknown" };
			}
			if (processPlatforms.length === 0) return { outcome: "unknown" };
			const outcomes = processPlatforms.map((processPlatform) => imageLoadabilityForPlatform(processPlatform, effectiveImagePlatforms, fileType, image.architecture));
			if (outcomes.every((outcome) => outcome === "compatible")) return {
				outcome: "compatible",
				...basis === undefined ? {} : { basis }
			};
			if (outcomes.every((outcome) => outcome === "incompatible")) return {
				outcome: "incompatible",
				...basis === undefined ? {} : { basis }
			};
			return {
				outcome: "unknown",
				...basis === undefined ? {} : { basis }
			};
		};
		imageLoadabilityForPlatform = (processPlatform, imagePlatforms, fileType, architecture) => {
			if (imagePlatforms.includes(processPlatform)) return "compatible";
			if (processPlatform === 6 && imagePlatforms.includes(1)) return "compatible";
			if (processPlatform === 2 && imagePlatforms.includes(6)) return "compatible";
			if (processPlatform === 2 && imagePlatforms.includes(11)) return "compatible";
			if (processPlatform === 7 && imagePlatforms.includes(12)) return "compatible";
			if (processPlatform === 1 && fileType === 2 && imagePlatforms.includes(6)) return "compatible";
			if (processPlatform === 2 && imagePlatforms.includes(1) && architecture.startsWith("arm64") || [
				7,
				8,
				9
			].includes(processPlatform) && imagePlatforms.includes(1)) return "unknown";
			if (isKnownPlatform(processPlatform) && imagePlatforms.every(isKnownPlatform)) return "incompatible";
			return "unknown";
		};
		isKnownPlatform = (platform) => platform >= 1 && platform <= 12;
		imageFacts = async (context, path) => {
			const known = context.images.get(path);
			if (known !== undefined) return known;
			const facts = await context.view.image(path);
			context.images.set(path, facts);
			return facts;
		};
		resolution = (candidates) => {
			let external = false;
			for (const candidate of candidates) {
				if (candidate.outcome === "resolved") return {
					status: external ? "conditional" : "resolved",
					image: candidate.resolved_path
				};
				if (candidate.outcome === "outside-target" || candidate.outcome === "escapes-target" || candidate.outcome === "unsupported" || candidate.outcome === "undetermined") external = true;
			}
			return {
				status: external ? "undetermined" : "unresolved",
				image: null
			};
		};
		resolveDependency = async (dependency, loader, context) => {
			const current = context.loaded.get(loader);
			const chain = current?.chain ?? [loader];
			const loaded = dependency.install_name.startsWith("@rpath/") ? context.byInstallName.get(dependency.install_name) : undefined;
			const candidates = [];
			if (loaded !== undefined) candidates.push({
				path: dependency.install_name,
				source: "already-loaded",
				rpath: null,
				rpath_owner: null,
				outcome: "resolved",
				resolved_path: loaded
			});
			else for (const template of candidateTemplates(dependency, loader, context)) {
				const candidate = await evaluateCandidate(template, context);
				candidates.push(candidate);
				if (candidate.outcome === "resolved") break;
			}
			const modeled = resolution(candidates);
			const searchUnknown = loaded === undefined && hasApplicableDyldOverrides(context.searchOverrides, dependency.install_name, modeled.image !== null);
			if (searchUnknown) context.environmentRoots.add(context.root);
			const searched = searchUnknown ? {
				...modeled,
				status: modeled.image === null ? "undetermined" : "conditional"
			} : modeled;
			const resolved = loaded !== undefined && context.loaded.get(loaded)?.conditional === true && searched.status === "resolved" ? {
				...searched,
				status: "conditional"
			} : searched;
			const image = resolved.image === null ? undefined : context.images.get(resolved.image);
			const selection = image?.status === "parsed" ? compatibleSlice(machoImageSlices(image), context.processIdentity) : undefined;
			const slice = selection?.kind === "selected" ? selection.slice : undefined;
			return {
				root: context.root,
				architecture: context.processIdentity.architecture,
				loader,
				via: [...chain],
				...dependency,
				candidates,
				resolution: resolved,
				install_name_matches: slice === undefined || slice.install_name === null ? null : slice.install_name === dependency.install_name,
				loader_conditional: current?.conditional ?? false
			};
		};
		traceProcess = async (context, rootSlice, signal) => {
			const edges = [];
			context.loaded.set(context.root, {
				slice: rootSlice,
				chain: [context.root],
				conditional: false
			});
			if (rootSlice.install_name !== null && rootSlice.install_name.startsWith("@rpath/")) context.byInstallName.set(rootSlice.install_name, context.root);
			const pending = [context.root];
			while (pending.length > 0) {
				if (signal?.aborted) throw new AnalysisCancelledError("trace_dylib_resolution", { cause: signal.reason });
				const loader = pending.pop() ?? "";
				const current = context.loaded.get(loader);
				if (current === undefined) continue;
				const created = [];
				for (const dependency of current.slice.dependencies) {
					const edge = await resolveDependency(dependency, loader, context);
					edges.push(edge);
					if (isLazyLoadCommand(dependency.command)) continue;
					const image = edge.resolution.image;
					if (image === null || context.loaded.has(image)) continue;
					const facts = context.images.get(image);
					const selection = facts?.status === "parsed" ? compatibleSlice(machoImageSlices(facts), context.processIdentity) : undefined;
					if (selection?.kind !== "selected") continue;
					const { slice } = selection;
					context.loaded.set(image, {
						slice,
						chain: [...current.chain, image],
						conditional: current.conditional || edge.resolution.status === "conditional"
					});
					if (slice.install_name !== null && slice.install_name.startsWith("@rpath/") && !context.byInstallName.has(slice.install_name)) context.byInstallName.set(slice.install_name, image);
					created.push(image);
				}
				pending.push(...created.reverse());
			}
			return edges;
		};
		projectTraceResult = (input) => {
			const reported = [...input.images.entries()].filter(([, facts]) => facts.status !== "not-mach-o").sort(([left], [right]) => compare(left, right));
			const unparsed = reported.filter(([, facts]) => facts.status !== "parsed").map(([path]) => path);
			return {
				roots: input.roots,
				images: reported.map(([path, facts]) => ({
					path,
					parse_status: facts.status === "not-mach-o" ? "unsupported" : facts.status,
					reason: facts.status === "parsed" || facts.status === "not-mach-o" ? null : facts.reason,
					slices: facts.status === "parsed" ? machoImageSlices(facts).map(withoutDependencies) : []
				})),
				edges: [...input.edges],
				findings: deriveFindings(input.edges, input.rootSlices),
				coverage: {
					status: unparsed.length === 0 && input.withoutArchitecture.length === 0 && input.environmentRoots.size === 0 && input.unknownPlatformCandidates.size === 0 && input.rootEnumeration?.status !== "unknown" ? "complete" : "partial",
					unparsed_images: unparsed,
					roots_without_architecture: [...input.withoutArchitecture]
				},
				limitations: [
					...DYLIB_RESOLUTION_LIMITATIONS,
					...input.rootEnumeration?.limitations ?? [],
					...input.environmentRoots.size === 0 ? [] : [`Roots ${[...input.environmentRoots].join(", ")} request applicable image-selection inputs through LC_DYLD_ENVIRONMENT that are not modeled; affected dependencies or inserted images remain uncertain.`],
					...input.unknownPlatformCandidates.size === 0 ? [] : [`In-root dylib candidates ${[...input.unknownPlatformCandidates].sort(compare).join(", ")} have unknown platform compatibility and are not treated as incompatible. Their dependent graphs may be incomplete.`],
					...input.implicitMacOSPlatformCandidates.size === 0 ? [] : [`In-root dylib candidates ${[...input.implicitMacOSPlatformCandidates].sort(compare).join(", ")} have no observed platform load command; macOS compatibility was derived from dyld's implicit-platform rule for an executable root with explicit macOS platform and a supported CPU type. Reported platform facts remain unchanged.`]
				]
			};
		};
		traceDylibLoading = async (view, request) => {
			const images = new Map();
			for (const path of request.unclassified ?? []) images.set(path, await view.image(path));
			const roots = [];
			const rootSlices = [];
			const edges = [];
			const withoutArchitecture = [];
			const environmentRoots = new Set();
			const unknownPlatformCandidates = new Set();
			const implicitMacOSPlatformCandidates = new Set();
			for (const root of request.roots) {
				const facts = await view.image(root);
				images.set(root, facts);
				if (facts.status !== "parsed") continue;
				const slices = machoImageSlices(facts).filter(({ architecture }) => request.architecture === undefined || machoArchitectureFamily(architecture) === request.architecture);
				if (slices.length === 0) withoutArchitecture.push(root);
				for (const slice of slices) {
					const executable = slice.file_type === "execute" ? root : null;
					const searchOverrides = executable === null ? [] : embeddedDyldOverrides(slice.dyld_environment, slice.platforms);
					if (searchOverrides.some(({ variable, value }) => variable === "DYLD_INSERT_LIBRARIES" && value !== "")) environmentRoots.add(root);
					roots.push({
						image: root,
						architecture: slice.architecture
					});
					rootSlices.push({
						image: root,
						slice
					});
					edges.push(...await traceProcess({
						view,
						root,
						processIdentity: {
							architecture: slice.architecture,
							cpu_type: slice.cpu_type,
							cpu_subtype: slice.cpu_subtype
						},
						searchOverrides,
						environmentRoots,
						unknownPlatformCandidates,
						implicitMacOSPlatformCandidates,
						platforms: slice.platforms,
						executable,
						loaded: new Map(),
						byInstallName: new Map(),
						images
					}, slice, request.signal));
				}
			}
			return projectTraceResult({
				images,
				roots,
				rootSlices,
				edges,
				withoutArchitecture,
				environmentRoots,
				unknownPlatformCandidates,
				implicitMacOSPlatformCandidates,
				rootEnumeration: request.rootEnumeration
			});
		};
		withoutDependencies = (slice) => ({
			architecture: slice.architecture,
			...slice.hidden === undefined ? {} : { hidden: slice.hidden },
			slice_offset: slice.slice_offset,
			slice_size: slice.slice_size,
			cpu_type: slice.cpu_type,
			cpu_subtype: slice.cpu_subtype,
			fat_cpu_type: slice.fat_cpu_type,
			fat_cpu_subtype: slice.fat_cpu_subtype,
			fat_alignment_exponent: slice.fat_alignment_exponent,
			file_type: slice.file_type,
			file_type_code: slice.file_type_code,
			platform: slice.platform,
			platforms: slice.platforms,
			install_name: slice.install_name,
			rpaths: slice.rpaths,
			dyld_environment: slice.dyld_environment,
			code_signature_present: slice.code_signature_present
		});
		compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
	})))();
}

//#endregion
//#region dist/domain/electron/electronFuses.js
var ELECTRON_FUSE_SENTINEL, ELECTRON_FUSE_STATE_BYTES, ELECTRON_FUSE_V1_NAMES, FUSE_IMPLICATIONS, OTHER_MEANS_LIMITATION, MISSING_SENTINEL_LIMITATION, byteSchema, fuseStateSchema, electronFuseSchema, electronFuseSentinelSchema, electronFuseSliceSchema, implicationLocation, electronFuseImplicationSchema, electronFuseReportSchema, inspectElectronFusesInputSchema, electronFuseState, electronFuseName, describeElectronFuseFindings, embeddedAsarIntegrityApplies, describeSentinel, implicationFor, validateReportBounds, implicationKey, validateSentinel;
function init_electronFuses() {
	return (init_electronFuses = __esmMin((() => {
		init_digests();
		init_localPath();
		ELECTRON_FUSE_SENTINEL = "dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX";
		ELECTRON_FUSE_STATE_BYTES = {
			disabled: 48,
			enabled: 49,
			removed: 114
		};
		ELECTRON_FUSE_V1_NAMES = [
			"RunAsNode",
			"EnableCookieEncryption",
			"EnableNodeOptionsEnvironmentVariable",
			"EnableNodeCliInspectArguments",
			"EnableEmbeddedAsarIntegrityValidation",
			"OnlyLoadAppFromAsar",
			"LoadBrowserProcessSpecificV8Snapshot",
			"GrantFileProtocolExtraPrivileges",
			"WasmTrapHandlers"
		];
		FUSE_IMPLICATIONS = [
			{
				subject: "node_cli_inspect_arguments",
				fuseIndex: 3,
				enabled: "honored",
				inactive: "not_honored"
			},
			{
				subject: "electron_run_as_node",
				fuseIndex: 0,
				enabled: "honored",
				inactive: "not_honored"
			},
			{
				subject: "embedded_asar_integrity_validation",
				fuseIndex: 4,
				enabled: "enforced",
				inactive: "not_enforced"
			},
			{
				subject: "only_load_app_from_asar",
				fuseIndex: 5,
				enabled: "restricted_to_app_asar",
				inactive: "not_restricted_to_app_asar"
			}
		];
		OTHER_MEANS_LIMITATION = "Fuse state does not prove the application enables Inspector through other means, such as app.commandLine or a remote-debugging switch in application code.";
		MISSING_SENTINEL_LIMITATION = "A missing sentinel means fuse state is unknown, not that every fuse is disabled.";
		byteSchema = z.int().min(0).max(255);
		fuseStateSchema = z.enum([
			"enabled",
			"disabled",
			"removed",
			"unknown"
		]);
		electronFuseSchema = z.strictObject({
			index: z.int().nonnegative(),
			name: z.string().min(1).nullable(),
			state: fuseStateSchema,
			raw_byte: byteSchema
		});
		electronFuseSentinelSchema = z.strictObject({
			sentinel_offset: z.int().nonnegative(),
			wire_version: byteSchema.nullable(),
			declared_length: byteSchema.nullable(),
			fuses: z.array(electronFuseSchema),
			complete: z.boolean()
		});
		electronFuseSliceSchema = z.strictObject({
			index: z.int().nonnegative(),
			file_offset: z.int().nonnegative(),
			size: z.int().nonnegative(),
			architecture: z.string().min(1).nullable(),
			hidden: z.boolean().exactOptional(),
			sentinel_count: z.int().nonnegative(),
			sentinels: z.array(electronFuseSentinelSchema)
		});
		implicationLocation = {
			relationship: z.literal("derivation"),
			slice_index: z.int().nonnegative(),
			sentinel_offset: z.int().nonnegative()
		};
		electronFuseImplicationSchema = z.discriminatedUnion("subject", [
			z.strictObject({
				...implicationLocation,
				subject: z.literal("node_cli_inspect_arguments"),
				fuse_index: z.literal(3),
				outcome: z.enum([
					"honored",
					"not_honored",
					"unknown"
				])
			}),
			z.strictObject({
				...implicationLocation,
				subject: z.literal("electron_run_as_node"),
				fuse_index: z.literal(0),
				outcome: z.enum([
					"honored",
					"not_honored",
					"unknown"
				])
			}),
			z.strictObject({
				...implicationLocation,
				subject: z.literal("embedded_asar_integrity_validation"),
				fuse_index: z.literal(4),
				outcome: z.enum([
					"enforced",
					"not_enforced",
					"unknown"
				])
			}),
			z.strictObject({
				...implicationLocation,
				subject: z.literal("only_load_app_from_asar"),
				fuse_index: z.literal(5),
				outcome: z.enum([
					"restricted_to_app_asar",
					"not_restricted_to_app_asar",
					"unknown"
				])
			})
		]);
		electronFuseReportSchema = z.strictObject({
			artifact: z.strictObject({
				selected_path: localPathStringSchema,
				resolved_path: localPathStringSchema,
				sha256: digestSchema,
				bytes: z.int().nonnegative(),
				format: z.enum([
					"mach-o",
					"mach-o-universal",
					"pe",
					"elf"
				])
			}).describe("Caller-selected path, resolved regular file, and the container that was read"),
			slices: z.array(electronFuseSliceSchema).describe("One entry per universal Mach-O slice, or a single entry for a thin Mach-O, PE, or ELF file. Sentinel offsets are file-absolute."),
			runtime_implications: z.array(electronFuseImplicationSchema).describe("Derivations from version-1 fuse bytes. Each entry names the fuse index it came from."),
			limitations: z.array(z.string().min(1))
		}).superRefine((report, context) => {
			validateReportBounds(report, context);
		});
		inspectElectronFusesInputSchema = z.strictObject({ path: absoluteLocalPathStringSchema.describe("Absolute filesystem path to a macOS .app bundle, Electron Framework binary, Windows PE executable, or Linux ELF executable") });
		electronFuseState = (byte) => {
			if (byte === ELECTRON_FUSE_STATE_BYTES.disabled) return "disabled";
			if (byte === ELECTRON_FUSE_STATE_BYTES.enabled) return "enabled";
			if (byte === ELECTRON_FUSE_STATE_BYTES.removed) return "removed";
			return "unknown";
		};
		electronFuseName = (wireVersion, index) => wireVersion === 1 ? ELECTRON_FUSE_V1_NAMES[index] ?? null : null;
		describeElectronFuseFindings = (slices, container) => {
			const runtime_implications = [];
			const limitations = [OTHER_MEANS_LIMITATION, MISSING_SENTINEL_LIMITATION];
			for (const slice of slices) {
				if (slice.sentinel_count === 0) limitations.push(`Slice ${slice.index} at file offset ${slice.file_offset} contains no Electron fuse sentinel; fuse state for that slice is unknown, not disabled.`);
				else if (slice.sentinel_count > 1) limitations.push(`Slice ${slice.index} at file offset ${slice.file_offset} contains ${slice.sentinel_count} Electron fuse sentinels; every sentinel is reported and none is selected.`);
				for (const sentinel of slice.sentinels) describeSentinel(slice.index, sentinel, container, runtime_implications, limitations);
			}
			return {
				runtime_implications,
				limitations
			};
		};
		embeddedAsarIntegrityApplies = (container) => container === "mach-o" || container === "mach-o-universal" || container === "pe";
		describeSentinel = (sliceIndex, sentinel, container, implications, limitations) => {
			if (!sentinel.complete) limitations.push(`Electron fuse wire at file offset ${sentinel.sentinel_offset} is truncated; fuse bytes past the slice stay unknown.`);
			if (sentinel.wire_version === null) return;
			if (sentinel.wire_version !== 1) {
				limitations.push(`Electron fuse wire at file offset ${sentinel.sentinel_offset} uses wire version ${sentinel.wire_version}; version 1 is the only pinned name table, so runtime implications for this wire are unknown.`);
				return;
			}
			for (const spec of FUSE_IMPLICATIONS) {
				const fuse = sentinel.fuses.find((item) => item.index === spec.fuseIndex);
				if (fuse === undefined) {
					limitations.push(`Electron fuse wire at file offset ${sentinel.sentinel_offset} does not include fuse index ${spec.fuseIndex}; that runtime implication is unknown.`);
					continue;
				}
				const applicabilityUnknown = spec.subject === "embedded_asar_integrity_validation" && !embeddedAsarIntegrityApplies(container);
				if (applicabilityUnknown) limitations.push(`Electron compiles embedded ASAR integrity validation only on macOS and Windows; the observed fuse byte at file offset ${sentinel.sentinel_offset} does not establish enforcement.`);
				implications.push(implicationFor(spec, applicabilityUnknown ? "unknown" : fuse.state, {
					slice_index: sliceIndex,
					sentinel_offset: sentinel.sentinel_offset
				}));
			}
		};
		implicationFor = (spec, state, location) => {
			const outcome = state === "enabled" ? spec.enabled : state === "unknown" ? "unknown" : spec.inactive;
			return {
				relationship: "derivation",
				subject: spec.subject,
				fuse_index: spec.fuseIndex,
				outcome,
				...location
			};
		};
		validateReportBounds = (report, context) => {
			const size = report.artifact.bytes;
			for (const [sliceIndex, slice] of report.slices.entries()) {
				if (slice.index !== sliceIndex) context.addIssue({
					code: "custom",
					path: [
						"slices",
						sliceIndex,
						"index"
					],
					message: "Slice index does not match its position in the report."
				});
				if (slice.sentinel_count !== slice.sentinels.length) context.addIssue({
					code: "custom",
					path: [
						"slices",
						sliceIndex,
						"sentinel_count"
					],
					message: "Sentinel count does not match the reported sentinels."
				});
				if (slice.file_offset > size || slice.size > size - slice.file_offset) context.addIssue({
					code: "custom",
					path: ["slices", sliceIndex],
					message: "Slice range extends outside the selected artifact."
				});
				for (const [sentinelIndex, sentinel] of slice.sentinels.entries()) validateSentinel(slice, sentinel, sliceIndex, sentinelIndex, context);
			}
			const expected = new Set(describeElectronFuseFindings(report.slices, report.artifact.format).runtime_implications.map(implicationKey));
			for (const [index, implication] of report.runtime_implications.entries()) {
				if (!expected.has(implicationKey(implication))) context.addIssue({
					code: "custom",
					path: ["runtime_implications", index],
					message: "Runtime implication is not supported by the reported fuse bytes and applicability."
				});
				const slice = report.slices[implication.slice_index];
				if (slice?.sentinels.some((sentinel) => sentinel.sentinel_offset === implication.sentinel_offset) !== true) context.addIssue({
					code: "custom",
					path: ["runtime_implications", index],
					message: "Runtime implication does not reference a reported sentinel."
				});
			}
		};
		implicationKey = (fact) => JSON.stringify([
			fact.slice_index,
			fact.sentinel_offset,
			fact.subject,
			fact.fuse_index,
			fact.outcome
		]);
		validateSentinel = (slice, sentinel, sliceIndex, sentinelIndex, context) => {
			const sentinelEnd = sentinel.sentinel_offset + ELECTRON_FUSE_SENTINEL.length;
			const wireEnd = sentinelEnd + (sentinel.wire_version === null ? 0 : 1) + (sentinel.declared_length === null ? 0 : 1) + sentinel.fuses.length;
			if (wireEnd > slice.file_offset + slice.size) context.addIssue({
				code: "custom",
				path: [
					"slices",
					sliceIndex,
					"sentinels",
					sentinelIndex
				],
				message: "Reported wire header or fuse bytes extend outside the slice."
			});
			if (sentinel.sentinel_offset < slice.file_offset || sentinelEnd > slice.file_offset + slice.size) context.addIssue({
				code: "custom",
				path: [
					"slices",
					sliceIndex,
					"sentinels",
					sentinelIndex,
					"sentinel_offset"
				],
				message: "Sentinel is outside its slice."
			});
			if (sentinel.wire_version === null && sentinel.declared_length !== null) context.addIssue({
				code: "custom",
				path: [
					"slices",
					sliceIndex,
					"sentinels",
					sentinelIndex,
					"declared_length"
				],
				message: "A wire without a version byte cannot declare a fuse count."
			});
			if (sentinel.complete && (sentinel.declared_length === null || sentinel.fuses.length !== sentinel.declared_length)) context.addIssue({
				code: "custom",
				path: [
					"slices",
					sliceIndex,
					"sentinels",
					sentinelIndex,
					"complete"
				],
				message: "A complete wire must contain every declared fuse byte."
			});
			if (!sentinel.complete && sentinel.declared_length !== null && sentinel.fuses.length >= sentinel.declared_length) context.addIssue({
				code: "custom",
				path: [
					"slices",
					sliceIndex,
					"sentinels",
					sentinelIndex,
					"complete"
				],
				message: "An incomplete wire must omit at least one declared fuse byte."
			});
			for (const [fuseIndex, fuse] of sentinel.fuses.entries()) {
				if (fuse.index !== fuseIndex) context.addIssue({
					code: "custom",
					path: [
						"slices",
						sliceIndex,
						"sentinels",
						sentinelIndex,
						"fuses",
						fuseIndex,
						"index"
					],
					message: "Fuse index does not match its wire position."
				});
				if (fuse.state !== electronFuseState(fuse.raw_byte)) context.addIssue({
					code: "custom",
					path: [
						"slices",
						sliceIndex,
						"sentinels",
						sentinelIndex,
						"fuses",
						fuseIndex,
						"state"
					],
					message: "Fuse state does not match its raw byte."
				});
				if (sentinel.wire_version !== null && fuse.name !== electronFuseName(sentinel.wire_version, fuse.index)) context.addIssue({
					code: "custom",
					path: [
						"slices",
						sliceIndex,
						"sentinels",
						sentinelIndex,
						"fuses",
						fuseIndex,
						"name"
					],
					message: "Fuse name does not match the pinned version-1 table."
				});
			}
		};
	})))();
}

//#endregion
export { machoArchitectureName as _, electronFuseState as a, dylibResolutionInputSchema as c, machoImageSlices as d, traceDylibLoading as f, machoArchitectureFamily as g, init_machoCpuIdentity as h, electronFuseReportSchema as i, dylibResolutionResultSchema as l, resolveTreePath as m, describeElectronFuseFindings as n, init_electronFuses as o, init_dyldPaths as p, electronFuseName as r, inspectElectronFusesInputSchema as s, ELECTRON_FUSE_SENTINEL as t, init_dylibResolution as u, machoCpuSubtypeBase as v };
import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { compareUnicodeCodePoints, digestCanonicalValue, digestSchema, hasCompleteInventoryCoverage, init_artifactInventoryEvidence, init_canonicalDigest, init_canonicalOrdering, init_digests, init_nativeConvention, init_unicodeCodePointOrder, isSwiftRuntimeLibrary, nativeRuntimeConvention, prefixedDigestSchema, uniqueSortedBy } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisInputError, err, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { bridgeCandidateCoverageSchema, init_bridgeCandidateProjection, init_mobileApplicationGraphProjection, projectCartesianCandidates, projectedComponentSchema, projectedFileComponents, projectedInventoryEntries, projectionEvidenceIdSchema, projectionPathSchema, unavailableComponentSchema } from "./bridgeCandidateProjection-CnT1LS_C.js";
import { z } from "zod";

//#region dist/domain/apple/appleBundleAnatomy.js
function* directoryPaths(tree) {
	for (const [parent, names] of tree.directories) for (const name of names) yield joinPath(parent, name);
}
var pathSchema, BUNDLE_EXTENSION, MACH_O_FORMATS, appleBundleSchema, isMachOFormat, isSidecar, isWithin, anatomyNameIs, anatomyChild, anatomyTailMatches, projectAppleBundleAnatomy, applicationRoots, detectBundles, indexTree, joinPath, directoryOf, enclosingBundle, bundleLayout, bundleRole, directFiles, contentDirectories, namedDirectory, namedFile, infoPlistPath, executableCandidates, signingPaths, platformsOf;
function init_appleBundleAnatomy() {
	return (init_appleBundleAnatomy = __esmMin((() => {
		init_unicodeCodePointOrder();
		pathSchema = z.string().min(1);
		BUNDLE_EXTENSION = /\.(?:app|appex|xpc|framework|systemextension|dext|bundle|plugin|qlgenerator|mdimporter)$/iu;
		MACH_O_FORMATS = ["mach-o", "mach-o-universal"];
		appleBundleSchema = z.strictObject({
			path: pathSchema,
			parent_path: pathSchema.nullable(),
			layout: z.enum([
				"shallow",
				"macos-deep",
				"versioned-framework"
			]),
			role: z.enum([
				"application",
				"app-extension",
				"xpc-service",
				"framework",
				"login-item",
				"system-extension",
				"driver-extension",
				"plug-in",
				"resource-bundle",
				"bundle",
				"helper-application",
				"nested-application"
			]),
			role_basis: z.literal("path-convention"),
			info_plist_path: pathSchema.nullable(),
			executable_candidates: z.array(pathSchema),
			signing_paths: z.array(pathSchema)
		});
		isMachOFormat = (format) => MACH_O_FORMATS.includes(format);
		isSidecar = (path) => {
			const segments = path.split("/");
			return segments.includes("__MACOSX") || (segments.at(-1) ?? "").startsWith("._");
		};
		isWithin = (path, root) => root === "." || path === root || path.startsWith(`${root}/`);
		anatomyNameIs = (actual, expected) => actual.toLocaleLowerCase("en-US") === expected.toLocaleLowerCase("en-US");
		anatomyChild = (names, expected) => {
			if (names === undefined) return null;
			let exact;
			let folded;
			for (const name of names) {
				if (name === expected) exact = name;
				else if (anatomyNameIs(name, expected) && (folded === undefined || compareUnicodeCodePoints(name, folded) < 0)) folded = name;
			}
			return exact ?? folded ?? null;
		};
		anatomyTailMatches = (path, expected) => {
			const actual = path.split("/");
			if (actual.length < expected.length) return false;
			const tail = actual.slice(-expected.length);
			return expected.every((name, index) => {
				const segment = tail[index];
				if (segment === undefined || segment.length === 0) return false;
				return name === "*" || anatomyNameIs(segment, name);
			});
		};
		projectAppleBundleAnatomy = (entries, subject) => {
			const tree = indexTree(entries);
			const roots = applicationRoots(tree, subject);
			return {
				roots,
				bundles: detectBundles(tree, roots)
			};
		};
		applicationRoots = (tree, subject) => {
			if (subject.format === "directory" && /\.app$/iu.test(subject.name)) return ["."];
			const found = new Set();
			for (const path of directoryPaths(tree)) {
				const segments = path.split("/");
				const app = segments[1];
				if (anatomyNameIs(segments[0] ?? "", "Payload") && app !== undefined && /\.app$/iu.test(app)) {
					found.add(`${segments[0]}/${app}`);
					continue;
				}
				const index = segments.findIndex((segment, position) => /\.app$/iu.test(segment) && anatomyNameIs(segments[position + 1] ?? "", "Contents"));
				if (index >= 0) found.add(segments.slice(0, index + 1).join("/"));
			}
			const roots = [...found];
			return roots.filter((root) => !roots.some((other) => other !== root && isWithin(root, other))).sort(compareUnicodeCodePoints);
		};
		detectBundles = (tree, roots) => {
			const paths = new Set(roots);
			for (const path of directoryPaths(tree)) {
				if (BUNDLE_EXTENSION.test(path.split("/").at(-1) ?? "") && roots.some((root) => isWithin(path, root))) paths.add(path);
			}
			return [...paths].sort(compareUnicodeCodePoints).map((path) => {
				const layout = bundleLayout(path, tree);
				return {
					path,
					parent_path: enclosingBundle(path, paths),
					layout,
					role: roots.includes(path) ? "application" : bundleRole(path),
					role_basis: "path-convention",
					info_plist_path: infoPlistPath(path, layout, tree),
					executable_candidates: executableCandidates(path, layout, tree),
					signing_paths: signingPaths(path, layout, tree)
				};
			});
		};
		indexTree = (entries) => {
			const directories = new Map();
			const files = new Map();
			for (const entry of entries) {
				const { path, kind } = entry;
				if (isSidecar(path)) continue;
				const segments = path.split("/");
				let parent = "";
				for (const [index, segment] of segments.entries()) {
					const leaf = index === segments.length - 1;
					if (!leaf || kind === "directory") {
						const names = directories.get(parent) ?? new Set();
						names.add(segment);
						directories.set(parent, names);
					} else if (kind === "file") {
						const children = files.get(parent) ?? new Map();
						children.set(segment, entry);
						files.set(parent, children);
					}
					parent = joinPath(parent, segment);
				}
			}
			return {
				directories,
				files
			};
		};
		joinPath = (directory, name) => directory === "" ? name : `${directory}/${name}`;
		directoryOf = (bundle) => bundle === "." ? "" : bundle;
		enclosingBundle = (path, bundles) => {
			if (path === ".") return null;
			const segments = path.split("/");
			for (let length = segments.length - 1; length > 0; length--) {
				const candidate = segments.slice(0, length).join("/");
				if (bundles.has(candidate)) return candidate;
			}
			return bundles.has(".") ? "." : null;
		};
		bundleLayout = (bundle, tree) => {
			const directory = directoryOf(bundle);
			if (namedDirectory(tree, directory, "Contents") !== null) return "macos-deep";
			if (namedDirectory(tree, directory, "Versions") !== null) return "versioned-framework";
			return "shallow";
		};
		bundleRole = (bundle) => {
			const segments = bundle.split("/");
			const name = (segments.at(-1) ?? "").toLowerCase();
			const container = segments.at(-2);
			if (name.endsWith(".appex")) return "app-extension";
			if (name.endsWith(".xpc")) return "xpc-service";
			if (name.endsWith(".framework")) return "framework";
			if (name.endsWith(".systemextension")) return "system-extension";
			if (name.endsWith(".dext")) return "driver-extension";
			if (name.endsWith(".bundle")) {
				if (anatomyNameIs(container ?? "", "PlugIns")) return "plug-in";
				return anatomyNameIs(container ?? "", "Resources") ? "resource-bundle" : "bundle";
			}
			if (!name.endsWith(".app")) return "plug-in";
			if (anatomyNameIs(container ?? "", "LoginItems") && anatomyNameIs(segments.at(-3) ?? "", "Library")) return "login-item";
			if (anatomyNameIs(container ?? "", "Helpers")) return "helper-application";
			return "nested-application";
		};
		directFiles = (directory, tree) => [...tree.files.get(directory)?.values() ?? []].sort((left, right) => compareUnicodeCodePoints(left.path, right.path));
		contentDirectories = (bundle, layout, tree) => {
			const directory = directoryOf(bundle);
			if (layout === "macos-deep") {
				const contents = namedDirectory(tree, directory, "Contents");
				return contents === null ? [] : [contents];
			}
			if (layout === "shallow") return [directory];
			const versions = namedDirectory(tree, directory, "Versions");
			if (versions === null) return [];
			return [...tree.directories.get(versions) ?? []].filter((version) => !anatomyNameIs(version, "Current")).map((version) => joinPath(versions, version)).sort(compareUnicodeCodePoints);
		};
		namedDirectory = (tree, directory, expected) => {
			const name = anatomyChild(tree.directories.get(directory), expected);
			return name === null ? null : joinPath(directory, name);
		};
		namedFile = (tree, directory, expected) => {
			const name = anatomyChild(tree.files.get(directory)?.keys(), expected);
			return name === null ? null : joinPath(directory, name);
		};
		infoPlistPath = (bundle, layout, tree) => {
			const directories = contentDirectories(bundle, layout, tree);
			if (directories.length !== 1) return null;
			const directory = directories[0];
			if (directory === undefined) return null;
			const parent = layout === "versioned-framework" ? namedDirectory(tree, directory, "Resources") : directory;
			if (parent === null) return null;
			return namedFile(tree, parent, "Info.plist");
		};
		executableCandidates = (bundle, layout, tree) => contentDirectories(bundle, layout, tree).flatMap((directory) => {
			const executableDirectory = layout === "macos-deep" ? namedDirectory(tree, directory, "MacOS") : directory;
			return executableDirectory === null ? [] : directFiles(executableDirectory, tree);
		}).filter(({ component }) => component !== undefined && isMachOFormat(component.format)).map(({ path }) => path);
		signingPaths = (bundle, layout, tree) => contentDirectories(bundle, layout, tree).flatMap((directory) => {
			const signature = namedDirectory(tree, directory, "_CodeSignature");
			return [
				signature === null ? null : namedFile(tree, signature, "CodeResources"),
				namedFile(tree, directory, "embedded.provisionprofile"),
				namedFile(tree, directory, "embedded.mobileprovision")
			];
		}).filter((path) => path !== null).sort(compareUnicodeCodePoints);
		platformsOf = (bundles) => [...new Set(bundles.flatMap(({ role, layout, info_plist_path: plist }) => {
			if (role !== "application") return [];
			if (layout === "macos-deep") return ["macos"];
			if (layout === "shallow" && plist !== null) return ["ios"];
			return [];
		}))].sort(compareUnicodeCodePoints);
	})))();
}

//#endregion
//#region dist/domain/apple/appleApplication.js
var APPLE_ROOT_FORMATS, appleApplicationProjectionResultSchema, projectAppleInventory, appleProjectionId, attributeComponents, appleRootFormat, isNativeLibrary, launchdDomain, classifyComponents, identifyRuntimeFamilies, identifyBridgeCandidates, bridgeBasis, projectionLimitations;
function init_appleApplication() {
	return (init_appleApplication = __esmMin((() => {
		init_analysisErrorCore();
		init_appleBundleAnatomy();
		init_nativeConvention();
		init_artifactInventoryEvidence();
		init_digests();
		init_canonicalDigest();
		init_bridgeCandidateProjection();
		init_mobileApplicationGraphProjection();
		init_canonicalOrdering();
		init_unicodeCodePointOrder();
		init_result();
		APPLE_ROOT_FORMATS = [
			"ipa",
			"directory",
			"zip",
			"dmg"
		];
		appleApplicationProjectionResultSchema = z.strictObject({
			projection_id: prefixedDigestSchema("aap"),
			root_sha256: digestSchema,
			root_format: z.enum(APPLE_ROOT_FORMATS),
			platforms: z.array(z.enum(["ios", "macos"])),
			source_evidence_ids: z.array(projectionEvidenceIdSchema).min(1),
			application_roots: z.array(projectionPathSchema),
			bundles: z.array(appleBundleSchema),
			components: z.strictObject({
				bundle_metadata: z.array(projectedComponentSchema),
				executables: z.array(projectedComponentSchema),
				frameworks: z.array(projectedComponentSchema),
				native_libraries: z.array(projectedComponentSchema),
				javascript: z.array(projectedComponentSchema),
				signing: z.array(projectedComponentSchema),
				privileged_helpers: z.array(projectedComponentSchema),
				launchd_plists: z.array(projectedComponentSchema.extend({ domain: z.enum(["agent", "daemon"]) })),
				helpers: z.array(projectedComponentSchema)
			}),
			unavailable_components: z.array(unavailableComponentSchema),
			symlinks: z.array(projectionPathSchema),
			runtime_families: z.array(z.enum([
				"native",
				"swift-objective-c",
				"javascript",
				"react-native",
				"flutter",
				"unity"
			])),
			bridge_candidates: z.array(z.strictObject({
				source_path: projectionPathSchema,
				native_path: projectionPathSchema,
				basis: z.enum([
					"javascript-and-native-content",
					"react-native-convention",
					"flutter-convention",
					"unity-convention"
				])
			})),
			bridge_candidate_coverage: bridgeCandidateCoverageSchema,
			coverage: z.strictObject({
				status: z.enum(["complete-within-inventory", "partial"]),
				inventory_complete: z.boolean()
			}),
			limitations: z.array(z.string())
		});
		projectAppleInventory = (source) => {
			const { evidence, inventory } = source;
			const rootFormatResult = appleRootFormat(inventory.manifest.root_format);
			if (!rootFormatResult.ok) return rootFormatResult;
			const rootFormat = rootFormatResult.value;
			const { entries, limitations: unresolved } = projectedInventoryEntries(inventory);
			const inventoried = projectedFileComponents(entries);
			const { roots, bundles } = projectAppleBundleAnatomy(entries, {
				name: evidence[0]?.subject?.name ?? "",
				format: rootFormat
			});
			const { all, unattributed } = attributeComponents(inventoried, roots, rootFormat);
			const unavailable = attributeComponents(entries.flatMap(({ kind, unavailable }) => (kind === "file" || kind === "slice") && unavailable !== undefined ? [unavailable] : []), roots, rootFormat);
			const classified = classifyComponents(entries, all, roots, bundles);
			const runtimeFamilies = identifyRuntimeFamilies(all);
			const bridgeProjection = identifyBridgeCandidates(classified.javascript, uniqueSortedBy([...classified.executables, ...classified.native_libraries], (component) => component.path), roots);
			const uninventoriedImage = rootFormat === "dmg" && inventory.occurrences.length === 1;
			const inventoryComplete = hasCompleteInventoryCoverage(inventory, "container-entries");
			const complete = inventoryComplete && !uninventoriedImage;
			const limitations = [
				...unresolved,
				...inventory.limitations,
				...projectionLimitations({
					complete: inventoryComplete,
					uninventoriedImage,
					roots,
					bundles,
					sidecars: entries.some(({ path }) => isSidecar(path)),
					symlinks: entries.some(({ kind }) => kind === "symlink"),
					unattributed: unattributed + unavailable.unattributed,
					unavailable: unavailable.all.length > 0,
					bridgeCandidateCoverage: bridgeProjection.coverage
				})
			];
			const withoutId = {
				root_sha256: inventory.manifest.root_sha256,
				root_format: rootFormat,
				platforms: platformsOf(bundles),
				source_evidence_ids: evidence.map(({ evidence_id: id }) => id).sort(compareUnicodeCodePoints),
				application_roots: roots,
				bundles,
				components: classified,
				unavailable_components: unavailable.all,
				symlinks: entries.filter(({ kind }) => kind === "symlink").map(({ path }) => path).sort(compareUnicodeCodePoints),
				runtime_families: runtimeFamilies,
				bridge_candidates: bridgeProjection.candidates,
				bridge_candidate_coverage: bridgeProjection.coverage,
				coverage: {
					status: complete && unavailable.all.length === 0 && bridgeProjection.coverage.status === "complete" ? "complete-within-inventory" : "partial",
					inventory_complete: inventory.complete
				},
				limitations
			};
			return ok(appleApplicationProjectionResultSchema.parse({
				...withoutId,
				projection_id: appleProjectionId(withoutId)
			}));
		};
		appleProjectionId = (projection) => `aap_${digestCanonicalValue(projection, "Apple application projection")}`;
		attributeComponents = (inventoried, roots, rootFormat) => {
			const visible = inventoried.filter(({ path }) => !isSidecar(path));
			if (rootFormat === "ipa") return {
				all: visible,
				unattributed: 0
			};
			const all = visible.filter(({ path }) => roots.some((root) => isWithin(path, root)));
			return {
				all,
				unattributed: visible.length - all.length
			};
		};
		appleRootFormat = (format) => {
			const root = APPLE_ROOT_FORMATS.find((candidate) => candidate === format);
			if (root === undefined) return err(new AnalysisInputError("project_apple_application_graph", {}, [{
				path: [
					"inventory_evidence",
					0,
					"normalized_result",
					"manifest",
					"root_format"
				],
				reason: "invalid_value",
				message: `Apple application projection requires IPA, directory, ZIP, or DMG inventory Evidence (got ${format})`
			}]));
			return ok(root);
		};
		isNativeLibrary = (path) => /\.(?:dylib|so)$/iu.test(path);
		launchdDomain = (path) => {
			if (anatomyTailMatches(path, [
				"Contents",
				"Library",
				"LaunchAgents",
				"*"
			])) return "agent";
			if (anatomyTailMatches(path, [
				"Contents",
				"Library",
				"LaunchDaemons",
				"*"
			])) return "daemon";
			return undefined;
		};
		classifyComponents = (entries, all, roots, bundles) => {
			const frameworkRoots = bundles.filter(({ role }) => role === "framework").map(({ path }) => path);
			const withinApp = (path) => roots.some((root) => isWithin(path, root));
			const matching = (predicate) => entries.flatMap(({ path, kind, component }) => kind === "file" && component !== undefined && !isSidecar(path) && withinApp(path) && predicate(path) ? [component] : []);
			const lastSegment = (path) => path.split("/").at(-1) ?? "";
			return {
				bundle_metadata: all.filter(({ path }) => anatomyNameIs(lastSegment(path), "Info.plist")),
				executables: all.filter(({ path, format }) => isMachOFormat(format) && (withinApp(path) || !isNativeLibrary(path))),
				frameworks: all.filter(({ path }) => frameworkRoots.some((root) => isWithin(path, root))),
				native_libraries: all.filter(({ path }) => isNativeLibrary(path)),
				javascript: all.filter(({ format }) => format === "javascript-bundle"),
				signing: all.filter(({ path }) => anatomyTailMatches(path, ["_CodeSignature", "CodeResources"]) || anatomyNameIs(lastSegment(path), "embedded.mobileprovision") || anatomyNameIs(lastSegment(path), "embedded.provisionprofile")),
				privileged_helpers: matching((path) => anatomyTailMatches(path, [
					"Contents",
					"Library",
					"LaunchServices",
					"*"
				])),
				launchd_plists: matching((path) => path.endsWith(".plist")).flatMap((component) => {
					const domain = launchdDomain(component.path);
					return domain === undefined ? [] : [{
						...component,
						domain
					}];
				}),
				helpers: matching((path) => anatomyTailMatches(path, [
					"Contents",
					"Helpers",
					"*"
				]))
			};
		};
		identifyRuntimeFamilies = (all) => {
			const families = new Set();
			if (all.some(({ format }) => ["mach-o", "mach-o-universal"].includes(format))) families.add("native");
			if (all.some(({ path }) => isSwiftRuntimeLibrary(path))) families.add("swift-objective-c");
			if (all.some(({ format }) => format === "javascript-bundle")) families.add("javascript");
			for (const { path } of all) {
				const convention = nativeRuntimeConvention(path);
				if (convention !== null) families.add(convention);
			}
			return [...families].sort(compareUnicodeCodePoints);
		};
		identifyBridgeCandidates = (scripts, native, roots) => {
			const owner = (path) => roots.find((root) => isWithin(path, root)) ?? null;
			const scriptGroups = [];
			for (const script of scripts) {
				const root = owner(script.path);
				const last = scriptGroups.at(-1);
				if (last?.root === root) last.left.push(script);
				else scriptGroups.push({
					root,
					left: [script]
				});
			}
			const nativeByRoot = new Map();
			for (const item of native) {
				const root = owner(item.path);
				const scoped = nativeByRoot.get(root) ?? [];
				scoped.push(item);
				nativeByRoot.set(root, scoped);
			}
			const groups = scriptGroups.map(({ root, left }) => ({
				left,
				right: nativeByRoot.get(root) ?? []
			}));
			return projectCartesianCandidates({
				groups,
				createCandidate: (source_path, item) => ({
					source_path,
					native_path: item.path,
					basis: bridgeBasis(item.path)
				})
			});
		};
		bridgeBasis = (path) => {
			const convention = nativeRuntimeConvention(path);
			if (convention === "react-native") return "react-native-convention";
			if (convention === "flutter") return "flutter-convention";
			if (convention === "unity") return "unity-convention";
			return "javascript-and-native-content";
		};
		projectionLimitations = (facts) => [
			...!facts.complete ? ["Source inventory coverage is partial; absence is unknown."] : [],
			...facts.uninventoriedImage ? ["The DMG's contents were not inventoried on this host; bundle absence is unknown."] : [],
			...facts.roots.length === 0 ? ["No application bundle (Payload/*.app or *.app/Contents) was present in the supplied inventory pages."] : [],
			...facts.bundles.some(({ layout, info_plist_path: plist }) => layout === "versioned-framework" && plist === null) ? ["A versioned framework has several version directories or no Versions/*/Resources/Info.plist; the Info.plist that Versions/Current selects is unknown because symlink targets are not inventoried."] : [],
			...facts.symlinks ? ["Symlinks are reported by path only; their targets are not inventoried, so bundles are reported at their real paths."] : [],
			...facts.unattributed > 0 ? [`${facts.unattributed} inventoried entries outside every application root are not attributed to the application.`] : [],
			...facts.sidecars ? ["AppleDouble sidecar entries (._* files and __MACOSX/) describe neighbouring files and are excluded from bundle roles."] : [],
			...facts.bridgeCandidateCoverage.status === "partial" ? [`Bridge candidate pairs exceeded the projection safety budget; ${facts.bridgeCandidateCoverage.omitted_candidates} hypotheses are omitted. Component arrays still include every component from the supplied inventory pages.`] : [],
			...facts.unavailable ? ["Some inventoried files have no authenticated content identity. Their paths and limitations are retained in unavailable_components; component absence is unknown."] : [],
			"Bundle roles follow path conventions. Read each info_plist_path with inspect_plist for CFBundleExecutable, identifiers, and declared services.",
			"Bundle identifiers and signing claims require dedicated plist and CMS parsing; this projection reports only exact paths and hashes.",
			"Runtime families are inferred from inventory formats and bounded framework path conventions, not observed runtime loading.",
			"Generic framework and dylib paths do not establish Swift or Objective-C; this inventory projection does not decode language metadata.",
			"Bridge candidates are path-based hypotheses, not observed runtime calls.",
			"A bridge basis is inferred from the native path and is repeated for every managed component."
		];
	})))();
}

//#endregion
export { appleApplicationProjectionResultSchema, init_appleApplication, projectAppleInventory };
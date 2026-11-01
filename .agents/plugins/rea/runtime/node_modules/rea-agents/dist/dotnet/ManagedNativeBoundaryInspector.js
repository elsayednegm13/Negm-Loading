import { admitManagedProjection } from "./ManagedDecodeBudget.js";
import { managedNativeBoundaryInspectionSchema, } from "../domain/managed/managedArtifact.js";
import { readManagedMetadataInventory, readManagedResourceDirectory, } from "./ManagedMetadataInventory.js";
import { readManagedMetadataLayout, } from "./ManagedMetadataLayout.js";
import { readTypeMemberListFacts } from "./ManagedTypeMemberLists.js";
import { readManagedPeLayout, } from "./ManagedPeReader.js";
import { appendManagedParseIssues, ManagedReaderFailure, managedMetadataFailureStatus, } from "./ManagedReaderFailure.js";
import { buildNativeBoundaryInspection, cliNative, nativeBoundarySummary, nativeImplementations, parseFields, parseImplMaps, parseMethods, parseModuleRefs, } from "./ManagedNativeBoundaryHelpers.js";
/**
 * Report a PE whose CLI metadata is absent or cannot be admitted. `cli`
 * holds the CLI header when the header itself was admitted; otherwise
 * the header is absent (`not-managed`) or unreadable (`malformed`).
 */
const emptyInspection = (target, bytes, classification, { cli = null, issues = [], metadataHeader = null, } = {}) => {
    return managedNativeBoundaryInspectionSchema.parse(admitManagedProjection({
        artifact: {
            path: target.path,
            sha256: target.sha256,
            byte_length: bytes.length,
            format: "pe",
        },
        module: null,
        metadata: {
            status: issues.some((issue) => managedMetadataFailureStatus(issue) === "partial")
                ? "partial"
                : classification === "malformed"
                    ? "malformed"
                    : "absent",
            version: metadataHeader?.version ?? null,
            table_row_counts: {},
        },
        identity_scope: {
            token_identity: "build-local",
            requires_artifact_sha256: target.sha256,
            requires_mvid: null,
        },
        cli_native: cliNative(cli),
        module_refs: [],
        pinvoke_imports: [],
        native_implementations: [],
        summary: nativeBoundarySummary(cli, {
            module_ref_count: 0,
            pinvoke_import_count: 0,
            native_implementation_count: 0,
        }),
        coverage: { state: "unavailable", issues },
        limitations: [
            "No CLI metadata was admitted; native boundary declarations are unavailable.",
            "Static inspection does not load or execute target code, so native export resolution is not performed.",
        ],
    }));
};
const readBoundaryInventory = (bytes, pe, cli, issues) => {
    const metadataOffset = pe.rvaToOffset(cli.metadata.rva, cli.metadata.size, "cli.metadata");
    const layout = readManagedMetadataLayout(bytes, metadataOffset, cli.metadata.size);
    const memberLists = readTypeMemberListFacts(bytes, layout);
    const inventory = readManagedMetadataInventory(bytes, layout, readManagedResourceDirectory(pe, issues), memberLists);
    return { layout, inventory };
};
/** Inspect managed/native boundary declarations from PE metadata without execution. */
export const inspectManagedNativeBoundariesBytes = (bytes, target) => {
    // An unmappable PE layout is invalid input for every managed operation.
    const pe = readManagedPeLayout(bytes);
    if (pe.cli === null)
        return emptyInspection(target, bytes, pe.cliDirectoryState !== "absent" ? "malformed" : "not-managed", { issues: pe.cliIssue === null ? [] : [pe.cliIssue] });
    const issues = [];
    let layout;
    let inventory;
    try {
        ({ layout, inventory } = readBoundaryInventory(bytes, pe, pe.cli, issues));
    }
    catch (cause) {
        if (!(cause instanceof ManagedReaderFailure))
            throw cause;
        return emptyInspection(target, bytes, "malformed", {
            cli: pe.cli,
            issues: [cause.issue],
            metadataHeader: cause.metadataHeader,
        });
    }
    try {
        const heapExtent = Math.max(layout.strings.size, layout.blob?.size ?? 0);
        appendManagedParseIssues(issues, inventory.issues);
        const moduleRefs = parseModuleRefs(bytes, layout, heapExtent, issues);
        const members = new Map([
            ...parseFields(bytes, layout, heapExtent, issues),
            ...parseMethods(bytes, layout, heapExtent, issues),
        ]);
        const imports = parseImplMaps({
            bytes,
            layout,
            heapExtent,
            modules: moduleRefs,
            members,
            issues,
        });
        const pinvokeTokens = new Set(imports
            .map(({ member_token }) => member_token)
            .filter((token) => token !== null));
        const implementations = nativeImplementations(members.values(), pinvokeTokens);
        return buildNativeBoundaryInspection({
            target,
            bytes,
            pe,
            layout,
            inventory,
            moduleRefs,
            imports,
            implementations,
            issues,
        });
    }
    catch (cause) {
        if (!(cause instanceof ManagedReaderFailure))
            throw cause;
        return emptyInspection(target, bytes, "malformed", {
            cli: pe.cli,
            issues: [...issues, cause.issue],
            metadataHeader: cause.metadataHeader,
        });
    }
};

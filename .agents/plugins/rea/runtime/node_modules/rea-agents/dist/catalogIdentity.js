import { createHash } from "node:crypto";
import canonicalize from "canonicalize";
import { PROMPT_CONTRACTS } from "./contracts/promptContracts.js";
import { TOOL_CONTRACTS } from "./contracts/toolContracts.js";
import { CLI_COMMAND_NAMES } from "./cliCommandNames.js";
import { compareUnicodeCodePoints } from "./domain/unicodeCodePointOrder.js";
import { advertisedInputJsonSchema, toolOutputSchemaWithMetadata, } from "./contracts/toolSchemaMetadata.js";
import { presentAdvertisedInputSchema, } from "./contracts/compactInputSchema.js";
import { COMPACT_INPUT_SCHEMA_BUDGET_BYTES, compactPresentationForMcpInputSchemaProfile, } from "./config/mcpInputSchemaProfile.js";
import { RECORDED_CATALOG_DIGEST_PROFILES } from "./recordedCatalogDigests.js";
const sortByName = (contracts) => [...contracts].sort((left, right) => compareUnicodeCodePoints(left.name, right.name));
const sortedToolContracts = sortByName(TOOL_CONTRACTS);
/**
 * Digested per-tool projection. Every contract field that changes what a
 * client receives belongs here, including `returns_target_content`: a server
 * that predates the untrusted-content framing must not digest equal to one
 * that emits `_meta.provenance`, or a stale process would report aligned.
 */
const createToolCatalog = (contracts) => contracts.map((contract) => ({
    name: contract.name,
    title: contract.title,
    surface: contract.kind,
    description: contract.description,
    effects: { ...contract.effects },
    returns_target_content: contract.returnsTargetContent,
    annotations: contract.annotations,
    input_schema: advertisedInputJsonSchema(contract),
    output_schema: toolOutputSchemaWithMetadata(contract)["~standard"].jsonSchema.output({ target: "draft-2020-12" }),
}));
const presentToolCatalog = (catalog, presentation) => presentation === undefined
    ? catalog
    : catalog.map((tool) => ({
        ...tool,
        input_schema: presentAdvertisedInputSchema(tool.input_schema, presentation),
    }));
const createPromptCatalog = (contracts) => contracts
    .map((contract) => ({
    name: contract.name,
    title: contract.title,
    description: contract.description,
    objective: contract.objective,
    arguments: contract.arguments,
    steps: contract.steps,
}))
    .sort((left, right) => compareUnicodeCodePoints(left.name, right.name));
const promptCatalog = createPromptCatalog(PROMPT_CONTRACTS);
const digest = (value) => {
    const encoded = canonicalize(value);
    if (encoded === undefined)
        throw new TypeError("Catalog is not canonical JSON");
    return createHash("sha256").update(encoded).digest("hex");
};
const digestCatalogs = (catalog, prompts, outputSchemaProfile) => {
    const tools = {
        output_schema_profile: outputSchemaProfile,
        catalog,
    };
    return {
        tools_sha256: digest(tools),
        prompts_sha256: digest(prompts),
        combined_sha256: digest({
            cli: CLI_COMMAND_NAMES,
            tools,
            prompts,
        }),
    };
};
/**
 * Catalog digests over the given tool contracts. Exported so tests can prove
 * which contract fields the identity covers; production uses
 * {@link FULL_CATALOG_IDENTITY}.
 */
export const createCatalogDigests = (contracts = TOOL_CONTRACTS, promptContracts = PROMPT_CONTRACTS, compactPresentation = undefined, outputSchemaProfile = "full") => digestCatalogs(presentToolCatalog(createToolCatalog(sortByName(contracts)), compactPresentation), createPromptCatalog(promptContracts), outputSchemaProfile);
/** Build-time identities share schema conversion across the four supported profiles. */
export const createCatalogDigestProfiles = (contracts = TOOL_CONTRACTS, promptContracts = PROMPT_CONTRACTS) => {
    const full = createToolCatalog(sortByName(contracts));
    const compact = presentToolCatalog(full, {
        budgetBytes: COMPACT_INPUT_SCHEMA_BUDGET_BYTES,
    });
    const prompts = createPromptCatalog(promptContracts);
    const outputProfiles = (catalog) => ({
        full: digestCatalogs(catalog, prompts, "full"),
        off: digestCatalogs(catalog, prompts, "off"),
    });
    return { full: outputProfiles(full), compact: outputProfiles(compact) };
};
export const createCatalogIdentity = (compactPresentation = undefined, outputSchemaProfile = "full") => {
    const selectedPresentation = compactPresentation === undefined
        ? undefined
        : { budgetBytes: compactPresentation.budgetBytes };
    // Only the exact built-in presentations have build-time identities. Source
    // runs and custom budgets still compute from their selected schemas lazily.
    const inputProfile = selectedPresentation === undefined
        ? "full"
        : selectedPresentation.budgetBytes === COMPACT_INPUT_SCHEMA_BUDGET_BYTES
            ? "compact"
            : undefined;
    let catalogDigests = inputProfile === undefined
        ? undefined
        : RECORDED_CATALOG_DIGEST_PROFILES?.[inputProfile][outputSchemaProfile];
    return {
        counts: {
            cli_commands: CLI_COMMAND_NAMES.length,
            mcp_tools: sortedToolContracts.length,
            mcp_prompts: promptCatalog.length,
        },
        get digests() {
            return (catalogDigests ??= createCatalogDigests(TOOL_CONTRACTS, PROMPT_CONTRACTS, selectedPresentation, outputSchemaProfile));
        },
    };
};
/**
 * Full input/output advertisement identity. Digests are recorded at build time
 * or computed on first use; this is independent of the configured default.
 */
export const FULL_CATALOG_IDENTITY = createCatalogIdentity();
/** Default MCP advertisement; explicit full/custom selections have their own identity. */
export const DEFAULT_CATALOG_IDENTITY = createCatalogIdentity(compactPresentationForMcpInputSchemaProfile(undefined));

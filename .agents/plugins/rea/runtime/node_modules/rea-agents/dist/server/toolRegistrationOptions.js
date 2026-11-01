import { toolInputSchemaWithMetadata, toolOutputSchemaWithMetadata, } from "../contracts/toolSchemaMetadata.js";
/** Project the canonical Zod contracts directly into SDK registration. */
export const toolRegistrationOptions = (contract) => ({
    title: contract.title,
    description: contract.description,
    inputSchema: toolInputSchemaWithMetadata(contract),
    outputSchema: toolOutputSchemaWithMetadata(contract),
    annotations: contract.annotations,
});
/** Register a workflow that validates raw input before effects and projects its own errors. */
export const applicationToolRegistrationOptions = (contract) => {
    const registration = toolRegistrationOptions(contract);
    const inputSchema = {
        "~standard": {
            ...registration.inputSchema["~standard"],
            vendor: "rea-application",
            validate: (value) => ({ value }),
        },
    };
    return { ...registration, inputSchema };
};

import { snapshotEnvironment } from "../process/snapshotEnvironment.js";
import { parseConfig } from "../config/parseConfig.js";
/** Bind one-shot analysis and status commands to one caller-selected environment. */
export const createDirectAnalysis = (selectedEnvironment) => {
    const environment = snapshotEnvironment(selectedEnvironment);
    const dependencies = {
        readConfiguration: () => parseConfig(environment),
        createBinarySession: async (config, logger) => {
            const { createBinarySession } = await import("./binary.js");
            return createBinarySession(config, logger, environment);
        },
        createManagedBinarySession: async () => {
            const { createManagedBinarySession } = await import("./binary.js");
            return createManagedBinarySession();
        },
        createNativeDispatchBinarySession: async (config, logger) => {
            const { createNativeDispatchBinarySession } = await import("./binary.js");
            return createNativeDispatchBinarySession(config, logger, environment);
        },
        createNativeBinarySession: async () => {
            const { createNativeBinarySession } = await import("./binary.js");
            return createNativeBinarySession(environment);
        },
        createArtifactBinarySession: async () => {
            const { createArtifactBinarySession } = await import("./binary.js");
            return createArtifactBinarySession(environment);
        },
    };
    const runDirectAnalysis = async (...args) => {
        const { runDirectAnalysis } = await import("../application/DirectAnalysis.js");
        return runDirectAnalysis(dependencies, ...args);
    };
    const runProviderAnalysis = async (...args) => {
        const { runProviderAnalysis } = await import("../application/DirectAnalysis.js");
        return runProviderAnalysis(dependencies, ...args);
    };
    const runSessionStatus = async (...args) => {
        const { runSessionStatus } = await import("../application/DirectAnalysisStatus.js");
        return runSessionStatus(dependencies, ...args);
    };
    return {
        runDirectAnalysis,
        runProviderAnalysis,
        runSessionStatus,
    };
};
/** Execute managed metadata without configuration or native provider candidates. */
export const runManagedProviderExecution = async (...args) => {
    const { runManagedProviderExecution } = await import("../application/DirectAnalysis.js");
    return runManagedProviderExecution({
        createManagedBinarySession: async () => {
            const { createManagedBinarySession } = await import("./binary.js");
            return createManagedBinarySession();
        },
    }, ...args);
};

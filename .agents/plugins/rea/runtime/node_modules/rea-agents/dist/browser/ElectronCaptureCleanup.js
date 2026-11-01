import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, } from "../artifacts/AnalysisCleanupLease.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { observeOwnedProcessLineage } from "../process/ProcessOwnershipObservation.js";
import { runWithExecutionLimits } from "./PlaywrightElectronExecution.js";
import { cleanupElectronProcesses } from "./ElectronProcessCleanup.js";
/** Transport acknowledgement and process-family release are independent facts. */
export class ElectronCaptureCleanup {
    #transport;
    #processes;
    #ownership;
    #closeOperation;
    #lineage;
    #processResult;
    constructor(application, ownership, lineage) {
        this.#ownership = ownership;
        this.#lineage = lineage;
        this.#transport = new AnalysisCleanupLease(async () => {
            // A deadline stops this wait, not the underlying Playwright close. Reuse
            // a still-running/fulfilled close; only a physical rejection permits retry.
            if (this.#closeOperation === undefined) {
                const closing = Promise.resolve().then(() => application.close());
                this.#closeOperation = closing;
                void closing.catch(() => {
                    if (this.#closeOperation === closing)
                        this.#closeOperation = undefined;
                });
            }
            await runWithExecutionLimits(this.#closeOperation, undefined, performance.now() + 5_000);
        }, ["browser_transport"]);
        const resources = this.#ownership === undefined
            ? ["owned_process_group"]
            : [
                "owned_process_group",
                `run:${this.#ownership.runId}`,
                `process-group:${String(this.#ownership.processGroupId)}`,
            ];
        this.#processes = new AnalysisCleanupLease(async () => {
            const cleanup = this.#ownership === undefined
                ? {
                    cleaned: false,
                    reason: "owned Electron process identity was unavailable",
                }
                : await this.#cleanupProcesses(this.#ownership);
            this.#processResult = cleanup;
            if (!cleanup.cleaned)
                throw new ArtifactReaderFailure("unavailable", cleanup.reason, {
                    cleanup: { reason: cleanup.reason, resources },
                });
        }, resources);
    }
    get processResult() {
        return this.#processResult;
    }
    get pendingResources() {
        return this.#pending.flatMap((lease) => lease.cleanupResources ?? []);
    }
    get #pending() {
        return [this.#transport, this.#processes].filter((lease) => !lease.released);
    }
    async release(scope) {
        const transport = await scope.release({
            kind: "lease",
            resource: "browser_transport",
            lease: this.#transport,
        });
        const processes = await scope.release({
            kind: "lease",
            resource: "owned_process_group",
            lease: this.#processes,
        });
        return { transport, processes };
    }
    bind(error) {
        new AnalysisCleanupLeaseGroup(error, this.#pending);
    }
    async #cleanupProcesses(ownership) {
        const current = await observeOwnedProcessLineage(ownership);
        if (current.status === "verified")
            this.#lineage = current;
        // Cached POSIX group IDs are candidates only; the shared primitive checks
        // current tokens/start identities. Windows requires this attempt's lineage.
        return cleanupElectronProcesses(ownership, process.platform === "win32" ? current : (this.#lineage ?? current));
    }
}

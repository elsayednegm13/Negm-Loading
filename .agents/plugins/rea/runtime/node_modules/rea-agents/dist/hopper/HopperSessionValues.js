import { DEFAULT_BRIDGE_MAX_REQUEST_BYTES } from "../config/bridgeMaxRequestBytes.js";
import { HopperProtocolError } from "../domain/hopperErrors.js";
import { err, ok } from "../domain/result.js";
/** Bound cleanup handshakes and the bridge's idle reconnection wait. */
export const HOPPER_SHUTDOWN_TIMEOUT_MS = 30_000;
/** Validate the bridge identity and exact per-launch run identifier. */
export const parseHopperServerInfo = (value, expectedRunId) => {
    if (typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        value.name === "REA Hopper bridge" &&
        typeof value.version === "string" &&
        typeof value.process_id === "number" &&
        Number.isSafeInteger(value.process_id) &&
        value.process_id > 0 &&
        value.run_id === expectedRunId) {
        const advertised = value.max_request_bytes;
        const maxRequestBytes = advertised === undefined ? DEFAULT_BRIDGE_MAX_REQUEST_BYTES : advertised;
        if (typeof maxRequestBytes !== "number" ||
            !Number.isSafeInteger(maxRequestBytes) ||
            maxRequestBytes <= 0)
            return err(new HopperProtocolError("Hopper bridge health result is invalid"));
        return ok({
            name: value.name,
            version: value.version,
            processId: value.process_id,
            maxRequestBytes,
        });
    }
    return err(new HopperProtocolError("Hopper bridge health result is invalid"));
};
/** Require confirmation that the REA bridge detached or its document closed. */
export const isHopperShutdownAcknowledgement = (value) => {
    if (typeof value !== "object" || value === null || Array.isArray(value))
        return false;
    if (value.shutdown !== true)
        return false;
    return ((value.analysis_stopped === true && value.document_closed === true) ||
        (value.document_closed === false && value.document_retained === true));
};
/** Detect the verified Linux bridge response that requires group cleanup. */
export const isHopperCleanupRequired = (value) => typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    value.shutdown === true &&
    value.cleanup_required === true;

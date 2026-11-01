import { AdbDeviceAnalysisService } from "../application/adb/AdbDeviceAnalysisService.js";
import { toolContract } from "../contracts/toolContracts.js";
import { createContractToolHandler } from "./contractToolHandler.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind ADB handlers to their exact named contracts through shared workflows. */
export const registerAdbTools = (server, service, logger, recordEvidence, withAdmittedAnalysis) => {
    const handler = createContractToolHandler(server, service, logger, recordEvidence, withAdmittedAnalysis);
    for (const contract of [
        toolContract("inspect_adb_client"),
        toolContract("list_adb_devices"),
        toolContract("inspect_adb_device"),
        toolContract("list_adb_packages"),
        toolContract("pull_adb_package"),
        toolContract("read_adb_logcat"),
        toolContract("inspect_adb_package"),
        toolContract("pull_adb_file"),
        toolContract("push_adb_file"),
        toolContract("capture_adb_screen"),
        toolContract("list_adb_processes"),
        toolContract("list_adb_directory"),
        toolContract("list_adb_features"),
        toolContract("list_adb_services"),
        toolContract("inspect_adb_display"),
        toolContract("inspect_adb_window"),
        toolContract("read_adb_setting"),
        toolContract("collect_adb_bugreport"),
        toolContract("resolve_adb_packages"),
        toolContract("install_adb_package"),
        toolContract("uninstall_adb_package"),
        toolContract("start_adb_app"),
        toolContract("start_adb_activity"),
        toolContract("stop_adb_app"),
    ]) {
        server.registerTool(contract.name, toolRegistrationOptions(contract), handler(contract));
    }
};

import { z } from "incur";
import { PcapAnalysisService } from "../application/pcap/PcapAnalysisService.js";
import { createPcapAnalysisProvider } from "../composition/pcap.js";
import { CLI_COMMANDS } from "../cliCommandNames.js";
import { logCliCommand } from "../cliLogging.js";
import { withCommandCancellation } from "./commandCancellation.js";
import { finishAnalysisCommand } from "./finishAnalysisCommand.js";
/** Expose the same explicit pcap requests through one-shot CLI commands. */
export const registerPcapCommands = (cli, logger, environment, provider = createPcapAnalysisProvider(environment)) => {
    const service = new PcapAnalysisService(provider);
    const execute = (name, operation, input) => withCommandCancellation((signal) => logCliCommand(logger, name, () => finishAnalysisCommand(() => service.execute(operation, input, { signal }), { close: () => provider.close() }, "pcap", operation, signal)));
    cli.command(CLI_COMMANDS.inspectPcapClient, {
        description: "Inspect the caller-selected tshark and capinfos binaries without reading a capture",
        args: z.object({}),
        run: () => execute(CLI_COMMANDS.inspectPcapClient, "inspect_pcap_client", {}),
    });
    cli.command(CLI_COMMANDS.inspectPcapCapture, {
        description: "Inspect one pcap/pcapng capture: endpoints, DNS, TLS SNI, and protocol distribution",
        args: z.object({
            path: z
                .string()
                .min(1)
                .describe("Local pcap or pcapng capture file to inspect"),
        }),
        run: ({ args }) => execute(CLI_COMMANDS.inspectPcapCapture, "inspect_pcap_capture", {
            path: args.path,
        }),
    });
};

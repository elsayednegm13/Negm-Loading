import { PcapProvider } from "../pcap/PcapProvider.js";
/** Construct one pcap provider bound to the caller-selected tools. */
export const createPcapAnalysisProvider = (environment = process.env) => new PcapProvider({ environment });

import { FULL_CATALOG_IDENTITY, createCatalogIdentity, } from "../catalogIdentity.js";
import { EvidenceMcpServerCore, } from "./EvidenceMcpServerCore.js";
/** Canonical composition retains the constructor's existing identity defaults. */
export class EvidenceMcpServer extends EvidenceMcpServerCore {
    constructor(info, options, recordEvidence, delivery, compactPresentation = undefined, omitOutputSchemas = false, identity) {
        super(info, options, recordEvidence, delivery, compactPresentation, omitOutputSchemas, identity ??
            (compactPresentation === undefined && !omitOutputSchemas
                ? FULL_CATALOG_IDENTITY
                : createCatalogIdentity(compactPresentation, omitOutputSchemas ? "off" : "full")));
    }
}

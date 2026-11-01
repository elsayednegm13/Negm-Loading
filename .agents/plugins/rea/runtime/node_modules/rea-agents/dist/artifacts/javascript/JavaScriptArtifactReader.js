import { AsarArtifactReader } from "../AsarArtifactReader.js";
import { DirectoryArtifactReader } from "../DirectoryArtifactReader.js";
/** Create the reader for an admitted JavaScript artifact format. */
export const createJavaScriptArtifactReader = (path, format, asarHeaderAdmission) => format === "asar"
    ? new AsarArtifactReader(path, asarHeaderAdmission === undefined
        ? {}
        : { headerAdmission: asarHeaderAdmission })
    : new DirectoryArtifactReader(path, "omit");

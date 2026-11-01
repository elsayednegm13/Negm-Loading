import { z } from "zod";
/**
 * Caller choice for declared-versus-observed artifact integrity mismatches.
 *
 * `fail` rejects the operation; `record-and-continue` keeps the observed bytes
 * as explicitly untrusted Evidence and reports each contradiction.
 */
export const artifactIntegrityPolicySchema = z
    .enum(["fail", "record-and-continue"])
    .default("fail");

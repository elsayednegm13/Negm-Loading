import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { copyFile } from "node:fs/promises";
import { err, ok } from "../domain/result.js";
import { RegularFileCleanupFailure } from "../filesystem/OwnedRegularFile.js";
import { readRegularFile } from "./RegularFileRead.js";
const isMissing = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
const errorDetail = (cause) => cause instanceof Error ? cause.message : String(cause);
/** Select a persistent snapshot only when its bytes match this transaction's original. */
export const selectCurrentRecoveryBackup = async (firstBackupPath, original, resources) => {
    const read = (path) => readRegularFile(path, {
        symlinks: "reject",
        ...(resources === undefined ? {} : { resources }),
    });
    const expected = Buffer.isBuffer(original)
        ? original
        : Buffer.from(original, "utf8");
    let firstBackup;
    try {
        firstBackup = await read(firstBackupPath);
    }
    catch (cause) {
        if (cause instanceof RegularFileCleanupFailure)
            throw cause;
        if (!isMissing(cause))
            return err({
                kind: "unreadable",
                path: firstBackupPath,
                detail: `The recovery backup could not be checked: ${errorDetail(cause)}`,
            });
    }
    if (firstBackup === undefined)
        return ok({ backupPath: firstBackupPath, present: false });
    if (firstBackup.equals(expected))
        return ok({ backupPath: firstBackupPath, present: true });
    const digest = createHash("sha256").update(expected).digest("hex");
    const recoveryPath = `${firstBackupPath}.${digest}.recovery`;
    let recovery;
    try {
        recovery = await read(recoveryPath);
    }
    catch (cause) {
        if (cause instanceof RegularFileCleanupFailure)
            throw cause;
        if (!isMissing(cause))
            return err({
                kind: "unreadable",
                path: recoveryPath,
                detail: `The recovery backup could not be checked: ${errorDetail(cause)}`,
            });
    }
    if (recovery !== undefined && !recovery.equals(expected))
        return err({
            kind: "occupied",
            path: recoveryPath,
            detail: `The recovery path already contains different data: ${recoveryPath}`,
        });
    return ok({ backupPath: recoveryPath, present: recovery !== undefined });
};
const copyExclusive = (source, destination) => copyFile(source, destination, fsConstants.COPYFILE_EXCL);
/**
 * Preserve a transaction's original bytes before it edits the file: keep a
 * matching first backup, otherwise copy them to the content-addressed recovery
 * path without replacing an earlier file, then verify the selected snapshot.
 */
export const preserveCurrentRecoveryBackup = async (firstBackupPath, source, original, { copy = copyExclusive, resources } = {}) => {
    const selection = await selectCurrentRecoveryBackup(firstBackupPath, original, resources);
    if (!selection.ok)
        return selection;
    const { backupPath } = selection.value;
    if (!selection.value.present) {
        try {
            await copy(source, backupPath);
        }
        catch (cause) {
            if (!(cause instanceof Error && "code" in cause && cause.code === "EEXIST"))
                return err({
                    kind: "copy",
                    path: backupPath,
                    detail: `The recovery backup could not be written: ${errorDetail(cause)}`,
                });
        }
    }
    const verified = await selectCurrentRecoveryBackup(firstBackupPath, original, resources);
    if (!verified.ok)
        return verified;
    if (verified.value.backupPath !== backupPath || !verified.value.present)
        return err({
            kind: "unverified",
            path: backupPath,
            detail: `The recovery backup does not match the configuration it preserves: ${backupPath}`,
        });
    return ok(backupPath);
};

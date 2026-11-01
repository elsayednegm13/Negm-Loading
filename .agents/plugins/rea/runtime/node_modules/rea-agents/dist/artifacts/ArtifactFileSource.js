import { lstat } from "node:fs/promises";
import { artifactIntegrityDetails } from "../domain/artifactIntegrity.js";
import { OwnedFileHandle } from "../filesystem/OwnedFileHandle.js";
import { readFileHandleChunks } from "../filesystem/readFileHandleChunks.js";
import { RegularFileAdmissionFailure, openRegularFile, sameRegularFileState, } from "../filesystem/RegularFile.js";
import { assertArtifactReadActive } from "./ArtifactFileOperation.js";
import { artifactFileAdmissionFailure } from "./ArtifactFileAdmission.js";
import { hashReadable } from "./ArtifactHash.js";
import { ArtifactReaderFailure } from "./ArtifactReader.js";
import { ArtifactResourceScope } from "./ArtifactResourceScope.js";
/** One persistent descriptor and hash binding, borrowing caller-admitted sources. */
export class ArtifactFileSource {
    path;
    diagnosticLabel;
    admitted;
    #scope = new ArtifactResourceScope();
    #owner;
    #opening;
    #boundSha256;
    constructor(path, diagnosticLabel, admitted) {
        this.path = path;
        this.diagnosticLabel = diagnosticLabel;
        this.admitted = admitted;
        this.#scope.addCloseHook(async () => {
            if (this.#owner !== undefined) {
                await this.#owner.close();
                this.#owner = undefined;
            }
            this.#opening = undefined;
            this.#boundSha256 = undefined;
        });
    }
    /** Verify the admitted descriptor; the selected pathname is not reinterpreted. */
    read(signal) {
        return this.#scope.run(() => this.#verify(signal));
    }
    /** Verify both the descriptor and the file currently at the caller-selected path. */
    readSelectedPath(signal) {
        return this.#scope.run(() => this.#verifySelectedPath(signal));
    }
    /** Bind verified bytes to the inventory's expected whole-carrier identity. */
    bindSha256(expectedSha256, signal) {
        return this.#scope.run(() => this.#bind(expectedSha256, signal, () => this.#verify(signal)));
    }
    /** Bind carrier bytes while the selected pathname continues to name the same source. */
    bindSelectedPathSha256(expectedSha256, signal) {
        return this.#scope.run(() => this.#bind(expectedSha256, signal, () => this.#verifySelectedPath(signal), () => this.#verifySelectedPath()));
    }
    /** Join admitted operations before closing; failed descriptor ownership stays retained. */
    close() {
        return this.#scope.close();
    }
    async #bind(expectedSha256, signal, verify, verifyCompletion = verify) {
        const { handle } = await verify();
        const observed = this.#boundSha256 ??
            (await hashReadable(readFileHandleChunks(handle, {
                signal,
                cancellationFailure: (reason) => new ArtifactReaderFailure("cancelled", `${this.diagnosticLabel} verification cancelled`, { cause: reason }),
            }), signal)).sha256;
        await verifyCompletion();
        assertArtifactReadActive(signal);
        if (observed !== expectedSha256)
            throw new ArtifactReaderFailure("integrity", `${this.diagnosticLabel} carrier changed after inventory`, undefined, artifactIntegrityDetails(".", { algorithm: "sha256", digest: expectedSha256 }, observed, false));
        this.#boundSha256 = observed;
    }
    async #verify(signal) {
        assertArtifactReadActive(signal);
        this.#opening ??= this.#admit(signal);
        const source = await this.#opening;
        const observed = await source.handle.stat();
        if (!sameRegularFileState(source.initial, observed))
            throw new ArtifactReaderFailure("integrity", `${this.diagnosticLabel} source identity changed: ${this.path}`);
        assertArtifactReadActive(signal);
        return source;
    }
    async #verifySelectedPath(signal) {
        assertArtifactReadActive(signal);
        this.#opening ??= this.#admit(signal);
        const source = await this.#opening;
        const [observed, selected] = await Promise.all([
            source.handle.stat(),
            lstat(this.path),
        ]);
        if (!sameRegularFileState(source.initial, observed) ||
            !sameRegularFileState(source.initial, selected))
            throw new ArtifactReaderFailure("integrity", `${this.diagnosticLabel} source identity changed: ${this.path}`);
        assertArtifactReadActive(signal);
        return source;
    }
    async #admit(signal) {
        try {
            if (this.admitted !== undefined)
                return {
                    handle: this.admitted.handle,
                    initial: this.admitted.initial,
                };
            const source = await openRegularFile(this.path, {
                symlinks: "reject",
                signal,
            });
            this.#owner = new OwnedFileHandle(source.handle);
            return source;
        }
        catch (cause) {
            if (cause instanceof RegularFileAdmissionFailure)
                this.#owner = cause.owner;
            throw artifactFileAdmissionFailure(this.path, this.diagnosticLabel, cause);
        }
    }
}

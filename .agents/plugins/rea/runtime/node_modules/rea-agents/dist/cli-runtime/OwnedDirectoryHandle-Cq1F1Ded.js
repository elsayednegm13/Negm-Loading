import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";

//#region dist/filesystem/OwnedDirectoryHandle.js
var OwnedDirectoryHandle;
function init_OwnedDirectoryHandle() {
	return (init_OwnedDirectoryHandle = __esmMin((() => {
		OwnedDirectoryHandle = class {
			handle;
			#state = { kind: "open" };
			constructor(handle) {
				this.handle = handle;
			}
			close() {
				if (this.#state.kind === "closed") return Promise.resolve();
				if (this.#state.kind === "closing") return this.#state.attempt;
				if (this.#state.kind === "failed") return Promise.reject(this.#state.cause);
				const attempt = Promise.resolve().then(async () => {
					try {
						await this.handle.close();
						this.#state = { kind: "closed" };
					} catch (cause) {
						this.#state = {
							kind: "failed",
							cause
						};
						throw cause;
					}
				});
				this.#state = {
					kind: "closing",
					attempt
				};
				return attempt;
			}
		};
	})))();
}

//#endregion
export { OwnedDirectoryHandle, init_OwnedDirectoryHandle };
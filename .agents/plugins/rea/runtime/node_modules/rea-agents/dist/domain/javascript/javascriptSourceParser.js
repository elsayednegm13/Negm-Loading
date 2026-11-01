import { parse } from "@babel/parser";
import * as t from "@babel/types";
import { hasOnlyInlineTypeExportSpecifiers, hasOnlyInlineTypeImportSpecifiers, isTypeOnlyExportDeclaration, isTypeOnlyImportDeclaration, isErasedJavaScriptDeclaration, semanticImportEqualsSpecifier, } from "./javascriptModuleDeclaration.js";
const runtimeContextByProgram = new WeakMap();
/** Only parser-owned facts establish module or CommonJS wrapper isolation. */
export const javaScriptRuntimeContext = (program) => runtimeContextByProgram.get(program) ?? "unknown";
/** Runtime strictness follows parser-owned mode, not erased TypeScript syntax. */
export const javaScriptProgramStrictness = (program) => {
    if (program.directives.some(({ value }) => value.value === "use strict"))
        return "strict";
    const context = javaScriptRuntimeContext(program);
    return context === "module"
        ? "strict"
        : context === "commonjs"
            ? "sloppy"
            : "unknown";
};
const hasRuntimeModuleDeclaration = (program) => program.body.some((node) => {
    if (t.isTSImportEqualsDeclaration(node))
        return semanticImportEqualsSpecifier(node) !== null;
    if (t.isImportDeclaration(node))
        return (!isTypeOnlyImportDeclaration(node) &&
            !hasOnlyInlineTypeImportSpecifiers(node));
    if (t.isExportNamedDeclaration(node) || t.isExportAllDeclaration(node))
        return (!isTypeOnlyExportDeclaration(node) &&
            (!t.isExportNamedDeclaration(node) ||
                (!hasOnlyInlineTypeExportSpecifiers(node) &&
                    (node.declaration == null ||
                        !isErasedJavaScriptDeclaration(node.declaration)))));
    return (t.isExportDefaultDeclaration(node) &&
        !isErasedJavaScriptDeclaration(node.declaration));
});
const parseWithRuntimeContext = (source, sourcePath, options, packageContext) => {
    const file = parse(source, options);
    runtimeContextByProgram.set(file.program, /\.c[jt]s$/iu.test(sourcePath ?? "")
        ? /\.d\.cts$/iu.test(sourcePath ?? "")
            ? "unknown"
            : "commonjs"
        : isExplicitModuleSourcePath(sourcePath)
            ? "module"
            : packageContext === "module" || packageContext === "commonjs"
                ? packageContext
                : packageContext === "unspecified" && /\.js$/iu.test(sourcePath ?? "")
                    ? file.program.sourceType === "module"
                        ? "module"
                        : "commonjs"
                    : file.program.body.some((node) => t.isTSExportAssignment(node))
                        ? // CommonJS isolation does not establish strict ESM semantics.
                            "commonjs"
                        : file.program.sourceType === "module" &&
                            hasRuntimeModuleDeclaration(file.program)
                            ? "module"
                            : "unknown");
    return file;
};
/**
 * Babel plugins for one source path. Single owner for TypeScript/JSX
 * mode selection (tsc + Babel `typescript` plugin semantics).
 *
 * - `dts:true` only for `.d.ts/.d.mts/.d.cts` ambient declarations;
 *   ordinary `.ts` keeps the missing-initializer diagnostic.
 * - `.js/.jsx/.mjs/.cjs` use JavaScript grammar with JSX. TypeScript reads
 *   some valid JavaScript differently (`c?x=>(a):y=>(b)` as a return type,
 *   `a<b>(c)` as a generic call), so it must not select their meaning.
 * - JSX enabled for `.tsx` and unknown paths; disabled for plain
 *   `.ts/.cts/.mts` (angle-bracket assertions, not JSX) and for all
 *   declaration files. `.mts` (including `.d.mts`) sets
 *   `disallowAmbiguousJSXLike`, matching tsc's `.mts` mode.
 * - `sourcePhaseImports` retains Node-supported WASM source imports as AST data.
 * - `decorators-legacy` always present: without it decorated sources fail
 *   hard instead of reporting recovered syntax, losing every derived fact.
 * - Unknown paths retain the existing JSX- and TypeScript-capable contract
 *   (best-effort parse; failures surface via `errorRecovery`).
 */
export const parserPluginsForPath = (sourcePath) => {
    const path = sourcePath ?? "";
    const syntax = ["decorators-legacy", "sourcePhaseImports"];
    if (/\.(?:js|jsx|mjs|cjs)$/iu.test(path))
        return [...syntax, "jsx"];
    const dts = /\.d\.(?:ts|mts|cts)$/iu.test(path);
    const isTsLike = /\.(?:ts|cts|mts)$/iu.test(path);
    const isTsx = /\.tsx$/iu.test(path);
    const isMts = /\.mts$/iu.test(path);
    const typescript = [
        "typescript",
        {
            dts,
            ...(isMts ? { disallowAmbiguousJSXLike: true } : {}),
        },
    ];
    const jsxCapable = !dts && (isTsx || !isTsLike);
    return jsxCapable ? [...syntax, "jsx", typescript] : [...syntax, typescript];
};
/** `.mjs` and `.mts` explicitly select module mode. */
export const isExplicitModuleSourcePath = (path) => /\.m[jt]s$/iu.test(path ?? "");
const runtimeSourceTypeForPath = (path) => /\.cjs$/iu.test(path ?? "")
    ? "commonjs"
    : isExplicitModuleSourcePath(path)
        ? "module"
        : "unambiguous";
/**
 * Parse a module or script with recovery. Babel tries module mode first and
 * keeps its strict-mode errors after falling back to a script, so a script
 * with errors is parsed again as a script. Strict errors that only the module
 * parse reports stay visible because the source may still be a module.
 */
export const parseRecoveredJavaScript = (source, sourcePath, options, observedPackageType) => {
    const filenameType = runtimeSourceTypeForPath(sourcePath);
    // Node package facts apply to .js/.ts sources, not explicit suffixes,
    // declaration wrappers, or an unknown JSX compilation pipeline.
    const packageContext = /\.(?:js|ts)$/iu.test(sourcePath ?? "") &&
        !/\.d\.ts$/iu.test(sourcePath ?? "")
        ? observedPackageType
        : undefined;
    // Retain TypeScript import syntax for later CommonJS compilation.
    const sourceType = filenameType !== "unambiguous"
        ? filenameType
        : packageContext === "module"
            ? "module"
            : packageContext === "commonjs" && /\.js$/iu.test(sourcePath ?? "")
                ? "commonjs"
                : "unambiguous";
    if (sourceType !== "unambiguous") {
        const normalizedOptions = { ...options };
        if (sourceType === "commonjs") {
            // Babel owns these wrapper semantics in CommonJS mode and rejects
            // explicit script overrides, including the reference-import options.
            delete normalizedOptions.allowAwaitOutsideFunction;
            delete normalizedOptions.allowReturnOutsideFunction;
            delete normalizedOptions.allowNewTargetOutsideFunction;
        }
        return {
            file: parseWithRuntimeContext(source, sourcePath, {
                ...normalizedOptions,
                sourceType,
                errorRecovery: true,
            }, packageContext),
            moduleOnlyErrors: [],
        };
    }
    const file = parseWithRuntimeContext(source, sourcePath, {
        ...options,
        sourceType: "unambiguous",
        errorRecovery: true,
    }, packageContext);
    if (file.program.sourceType !== "script" || file.errors.length === 0)
        return { file, moduleOnlyErrors: [] };
    const script = parseWithRuntimeContext(source, sourcePath, {
        ...options,
        sourceType: "script",
        errorRecovery: true,
    }, packageContext);
    const scriptErrors = new Set(script.errors.map((error) => error.message));
    return {
        file: script,
        moduleOnlyErrors: javaScriptRuntimeContext(script.program) === "commonjs"
            ? []
            : file.errors
                .map((error) => error.message)
                .filter((message) => !scriptErrors.has(message)),
    };
};
/** Parse inert JavaScript or TypeScript facts without attaching comments to AST nodes. */
export const parseJavaScriptSource = (source, sourcePath) => {
    try {
        const runtimeSourceType = runtimeSourceTypeForPath(sourcePath);
        const commonjs = runtimeSourceType === "commonjs";
        const options = {
            errorRecovery: true,
            attachComment: false,
            plugins: parserPluginsForPath(sourcePath),
        };
        const file = parseWithRuntimeContext(source, sourcePath, {
            ...options,
            // Inert artifact analysis retains module declarations even in .cjs assets.
            // Infer their syntax here; reference imports keep filename-mode diagnostics.
            sourceType: commonjs ? "unambiguous" : runtimeSourceType,
            allowReturnOutsideFunction: commonjs,
            allowNewTargetOutsideFunction: commonjs,
        });
        // Unambiguous mode retains module-only diagnostics after choosing a script.
        // The .cjs extension establishes wrapper mode, so obtain its own diagnostics.
        return commonjs &&
            file.program.sourceType === "script" &&
            file.errors.length > 0
            ? parseWithRuntimeContext(source, sourcePath, {
                ...options,
                sourceType: "commonjs",
            })
            : file;
    }
    catch (cause) {
        // Unparseable source is represented by the null return.
        void cause;
        return null;
    }
};

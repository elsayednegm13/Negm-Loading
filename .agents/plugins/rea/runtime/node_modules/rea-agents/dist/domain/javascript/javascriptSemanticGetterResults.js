import * as t from "@babel/types";
import { unwrapJavaScriptExpression, semanticStaticPropertyKey, } from "./javascriptAstValues.js";
import { semanticCallableResultExpressions } from "./javascriptSemanticCallableResults.js";
import { semanticBindingAtRead } from "./javascriptSemanticMutationInitializers.js";
import { semanticReferenceSourcesInactive } from "./javascriptSemanticReferenceSources.js";
import { resolveSemanticBindingState, } from "./javascriptSemanticState.js";
import { semanticObjectPropertyReferences, semanticArrayPropertyReferences, } from "./javascriptSemanticObjectReferences.js";
import { SemanticGetterQuery, } from "./javascriptSemanticGetterQueries.js";
/** Branch syntax contributes alternatives without evaluating application code. */
const resultBranches = (node) => {
    if (t.isConditionalExpression(node))
        return [node.consequent, node.alternate];
    if (t.isLogicalExpression(node))
        return [node.left, node.right];
    if (t.isSequenceExpression(node)) {
        const last = node.expressions.at(-1);
        return last === undefined ? [] : [last];
    }
    if (t.isAssignmentExpression(node)) {
        if (node.operator === "=")
            return [node.right];
        if (["&&=", "||=", "??="].includes(node.operator))
            return [node.left, node.right];
    }
    return undefined;
};
/** Each walk owns local aliases; getter-to-getter traversal belongs to the query worklist. */
class GetterResultWalker {
    job;
    query;
    resolvers;
    #pending = [];
    #aliases = new Map();
    #scope;
    constructor(job, query, resolvers, roots = semanticCallableResultExpressions(job.invocation.getter)) {
        this.job = job;
        this.query = query;
        this.resolvers = resolvers;
        for (const { node } of roots)
            if (node !== null)
                this.#enqueue(() => ({ node, path: job.path }));
        this.#scope = query.state.scopeByNode.get(job.invocation.getter)?.scopeId;
    }
    run() {
        for (let cursor = 0; cursor < this.#pending.length; cursor++) {
            const current = this.#pending[cursor];
            if (current !== undefined)
                this.#visit(current);
        }
    }
    #enqueue(create) {
        if (!this.query.reserveResult())
            return;
        const work = create();
        // The fallback escapes receiver roots. Keeping local suffix permutations
        // here would repeat the precise expansion inside a single getter.
        this.#pending.push(this.query.widening
            ? {
                ...work,
                path: [],
                escapes: true,
                ...(work.privateRead === undefined
                    ? {}
                    : { privateRead: { ...work.privateRead, path: [] } }),
            }
            : work);
    }
    #retain(current, reference) {
        this.query.retain(reference, current.escapes || this.job.escapes);
    }
    #privateRead(current) {
        if (current.privateRead !== undefined)
            this.#retain(current, {
                node: current.privateRead.node,
                path: current.escapes ? [] : current.privateRead.path,
            });
    }
    #localBinding(expression) {
        const state = this.query.state;
        const binding = resolveSemanticBindingState(state, expression, expression.name);
        let scope = binding === undefined ? undefined : state.scopesById.get(binding.scopeId);
        while (scope !== undefined && scope.scopeId !== this.#scope) {
            if (scope.kind === "function" || scope.parentScopeId === null)
                return undefined;
            scope = state.scopesById.get(scope.parentScopeId);
        }
        return scope !== undefined &&
            binding?.referenceInitializers.every((initializer) => initializer.copyKind === undefined)
            ? binding
            : undefined;
    }
    #cycle(current, identity) {
        for (let visit = current.aliases; visit !== undefined; visit = visit.parent)
            if (visit.identity === identity)
                return visit;
        return undefined;
    }
    #alias(current, expression) {
        const binding = this.#localBinding(expression);
        if (binding === undefined)
            return false;
        const identity = JSON.stringify([
            binding.bindingId,
            expression.start,
            expression.end,
        ]);
        const previous = this.#cycle(current, identity);
        if (previous !== undefined) {
            // Growing aliases can reach arbitrarily deep children of the same roots.
            if (current.path.length > previous.pathLength && !current.escapes)
                this.#enqueue(() => ({
                    ...current,
                    path: [],
                    aliases: undefined,
                    escapes: true,
                }));
            return true;
        }
        const key = JSON.stringify([
            current.path,
            current.privateRead?.name,
            current.privateRead?.path,
            current.escapes,
        ]);
        const known = this.#aliases.get(identity) ?? new Set();
        if (!known.has(key)) {
            known.add(key);
            this.#aliases.set(identity, known);
            this.#aliasOrigins(current, expression, binding, identity);
        }
        return true;
    }
    #aliasOrigins(current, expression, binding, identity) {
        const state = this.query.state;
        const { binding: origins } = semanticBindingAtRead(binding, expression, state.parentsByNode);
        const aliases = {
            identity,
            pathLength: current.path.length,
            ...(current.aliases === undefined ? {} : { parent: current.aliases }),
        };
        for (const initializer of [
            ...origins.initializers,
            ...origins.referenceInitializers.filter((origin) => !semanticReferenceSourcesInactive(origin, state)),
        ])
            this.#enqueue(() => ({
                ...current,
                node: initializer.node,
                path: [...initializer.projection, ...current.path],
                aliases,
            }));
    }
    #ownsThis(expression) {
        let owner = this.query.state.parentsByNode.get(expression);
        while (owner !== undefined &&
            !t.isClass(owner) &&
            !(t.isFunction(owner) && !t.isArrowFunctionExpression(owner)))
            owner = this.query.state.parentsByNode.get(owner);
        return owner === this.job.invocation.getter;
    }
    #privateValue(current, owner) {
        const read = current.privateRead;
        if (read === undefined)
            return;
        const { getter, receiver = owner } = this.job.invocation;
        const isStatic = t.isClassMethod(getter) && getter.static;
        if (!t.isClass(receiver) ||
            !this.resolvers.privateReceiver(receiver, owner, current.path, isStatic)) {
            this.#privateRead(current);
            return;
        }
        for (const member of owner.body.body)
            if (t.isClassPrivateProperty(member) &&
                member.static === isStatic &&
                member.key.id.name === read.name &&
                member.value != null)
                this.#retain(current, {
                    node: member.value,
                    path: current.escapes ? [] : read.path,
                });
    }
    #thisValue(current, expression) {
        if (!this.#ownsThis(expression))
            return;
        const { getter, owner, receiver = owner } = this.job.invocation;
        if (current.privateRead !== undefined && t.isClass(owner)) {
            this.#privateValue(current, owner);
            return;
        }
        const references = t.isClass(receiver)
            ? this.resolvers.classReferences({
                owner: receiver,
                kind: t.isClassMethod(getter) && getter.static ? "static" : "instance",
            }, current.path, current.escapes || this.job.escapes)
            : this.resolvers.objectReferences(receiver, current.path);
        for (const reference of references)
            this.#retain(current, reference);
    }
    #superValue(current, expression) {
        const { getter, owner, receiver = owner } = this.job.invocation;
        if (!t.isSuper(expression.object) ||
            !t.isClass(owner) ||
            owner.superClass == null)
            return false;
        const key = semanticStaticPropertyKey(expression.property, expression.computed);
        for (const base of this.resolvers.bases(owner.superClass))
            for (const reference of this.resolvers.classReferences({
                owner: base,
                receiver: t.isClass(receiver) ? receiver : owner,
                kind: t.isClassMethod(getter) && getter.static ? "static" : "prototype",
            }, [key, ...current.path], current.escapes || this.job.escapes))
                this.#retain(current, reference);
        return true;
    }
    #member(current, expression) {
        if (current.privateRead !== undefined &&
            t.isPrivateName(expression.property)) {
            this.#privateRead(current);
            return;
        }
        if (t.isPrivateName(expression.property) &&
            t.isClass(this.job.invocation.owner)) {
            const name = expression.property.id.name;
            this.#enqueue(() => ({
                ...current,
                node: expression.object,
                path: [],
                privateRead: {
                    node: expression,
                    name,
                    path: current.path,
                },
            }));
            return;
        }
        if (!this.#superValue(current, expression))
            this.#enqueue(() => ({
                ...current,
                node: expression.object,
                path: [
                    semanticStaticPropertyKey(expression.property, expression.computed),
                    ...current.path,
                ],
            }));
    }
    #visit(current) {
        const expression = unwrapJavaScriptExpression(current.node).node;
        if (t.isIdentifier(expression) && this.#alias(current, expression))
            return;
        if (t.isForOfStatement(expression)) {
            this.#enqueue(() => ({
                ...current,
                node: expression.right,
                path: [null, ...current.path],
            }));
            return;
        }
        if (t.isThisExpression(expression) || t.isSuper(expression))
            this.#thisValue(current, expression);
        else if (t.isMemberExpression(expression) ||
            t.isOptionalMemberExpression(expression))
            this.#member(current, expression);
        else {
            const branches = resultBranches(expression);
            if (branches !== undefined)
                for (const node of branches)
                    this.#enqueue(() => ({ ...current, node }));
            else if (current.privateRead !== undefined)
                this.#privateRead(current);
            else if (current.path.length > 0 &&
                (t.isObjectExpression(expression) || t.isArrayExpression(expression)) &&
                this.resolvers.containerReferences !== undefined) {
                for (const reference of this.resolvers.containerReferences(expression, current.path))
                    this.#enqueue(() => ({
                        ...current,
                        node: reference.node,
                        path: reference.path,
                    }));
            }
            else
                this.#retain(current, { node: expression, path: current.path });
        }
    }
}
export const expandSemanticGetterResult = (job, query, resolvers) => new GetterResultWalker(job, query, resolvers).run();
/** Project an effect operand through the same local aliases and `this` owner as getter results. */
export const semanticGetterReceiverReferences = (getter, operand, state) => {
    const parent = state.parentsByNode.get(getter);
    const owner = t.isClassBody(parent)
        ? state.parentsByNode.get(parent)
        : parent;
    if (!t.isObjectExpression(owner) && !t.isClass(owner))
        return [];
    const query = new SemanticGetterQuery(state);
    let privateReceiver = false;
    const references = query.run(() => {
        query.schedule({ getter, owner }, []);
        return [];
    }, (job) => new GetterResultWalker(job, query, {
        objectReferences: (_receiver, path) => [{ node: getter, path }],
        classReferences: (_lookup, path) => [{ node: getter, path }],
        privateReceiver: () => {
            // Keep private-field initializer identity from the existing
            // getter owner; private slots are not public property paths.
            privateReceiver = true;
            return true;
        },
        bases: () => [],
        containerReferences: (node, path) => t.isObjectExpression(node)
            ? semanticObjectPropertyReferences(node, path, state)
            : semanticArrayPropertyReferences(node, path),
    }, [{ node: operand }]).run());
    return references.filter(({ node }) => node === getter || privateReceiver);
};

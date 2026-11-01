import * as t from "@babel/types";
import { symbolicDefiniteExit } from "./javascriptSymbolicControlFlow.js";
/**
 * One collector's immutable syntax facts. Positions replace repeated body
 * searches; ordinary fallthrough statements need no replay. Conditional tests
 * remain present even when neither branch exits, since evaluating them belongs
 * to the invocation's symbolic environment and can establish unknown coverage.
 */
export class ElectronCallPathBlockPrefixes {
    admitVisit;
    #blocks = new WeakMap();
    #facts = new WeakMap();
    constructor(admitVisit) {
        this.admitVisit = admitVisit;
    }
    statement(statement) {
        const cached = this.#facts.get(statement);
        if (cached !== undefined)
            return cached;
        const fact = symbolicDefiniteExit(statement)
            ? { kind: "exit" }
            : t.isIfStatement(statement)
                ? {
                    kind: "branch",
                    test: statement.test,
                    consequentExits: symbolicDefiniteExit(statement.consequent),
                    alternateExits: symbolicDefiniteExit(statement.alternate),
                }
                : null;
        this.#facts.set(statement, fact);
        return fact;
    }
    *before(block, child) {
        let index = this.#blocks.get(block);
        if (index === undefined) {
            const positions = new WeakMap();
            const entries = [];
            for (const [position, statement] of block.body.entries()) {
                if (!this.admitVisit())
                    return undefined;
                positions.set(statement, position);
                const fact = this.statement(statement);
                if (fact !== null)
                    entries.push({ position, fact });
                if ((position + 1) % 1024 === 0)
                    yield;
            }
            index = { positions, entries };
            this.#blocks.set(block, index);
        }
        const before = index.positions.get(child);
        return before === undefined
            ? undefined
            : { entries: index.entries, before };
    }
}

import { Cli } from "incur";
// Incur types its router key without vars, env, or globals; accept any CLI.
const registeredCommands = Cli.toCommands;
/** Visit ordinary commands in map order, children before each group's root. */
export const visitRegisteredCommands = (cli, visit) => {
    const commands = registeredCommands.get(cli);
    if (commands !== undefined)
        visitCommands(commands, [], undefined, visit);
};
const visitCommands = (commands, parents, inheritedPolicy, visit) => {
    for (const [name, entry] of commands) {
        const path = [...parents, name];
        if ("_group" in entry) {
            const policy = entry.outputPolicy ?? inheritedPolicy;
            visitCommands(entry.commands, path, policy, visit);
            if (entry.root !== undefined)
                visit(entry.root, path.join(" "), entry.root.outputPolicy ?? policy);
        }
        else if (!("_alias" in entry) && !("_fetch" in entry)) {
            visit(entry, path.join(" "), entry.outputPolicy ?? inheritedPolicy);
        }
    }
};

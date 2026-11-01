/** Whether an instruction contributes a method or field operand fact to member analysis. */
export const isManagedMemberReferenceInstruction = (instruction) => instruction.opcode !== "ldtoken" &&
    instruction.operand !== null &&
    (instruction.operand_kind === "method" ||
        instruction.operand_kind === "field");

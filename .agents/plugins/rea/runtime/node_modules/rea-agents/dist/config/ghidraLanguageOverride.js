import { z } from "zod";
// Ghidra language IDs are four colon-separated fields; variants may contain
// spaces ("x86:LE:16:Real Mode") but never leading or trailing whitespace.
// Stock .ldefs also use "/" in processors ("M16C/60") and LEBE for ARM BE8
// (big-endian data, little-endian instructions).
export const ghidraLanguageIdSchema = z
    .string()
    .regex(/^[A-Za-z0-9_.+-]+(?:\/[A-Za-z0-9_.+-]+)*:(?:LE|BE|LEBE):[1-9]\d*:[A-Za-z0-9_.+-](?:[A-Za-z0-9_.+ -]*[A-Za-z0-9_.+-])?$/u, "must be a Ghidra language ID such as x86:LE:32:default");
export const ghidraCompilerSpecIdSchema = z
    .string()
    .regex(/^[A-Za-z0-9_.+-]+$/u, "must be a Ghidra compiler-spec ID such as default or borlandcpp");

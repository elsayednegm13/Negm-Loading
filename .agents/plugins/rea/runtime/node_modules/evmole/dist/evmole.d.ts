/* tslint:disable */
/* eslint-disable */

/**
Represents a basic block in the control flow graph
 * @property id - Unique block identifier (CFG key)
 * @property start - Byte offset where the block's first opcode begins
 * @property end - Byte offset where the block's last opcode begins
 * @property type - Block type
 * @property data - Type-specific data
 */
export type Block = {
    id: number,
    start: number,
    end: number,
    type: 'Terminate' | 'Jump' | 'Jumpi' | 'DynamicJump' | 'DynamicJumpi';
} & (
| {
    type: 'Terminate';
    data: { success: boolean };
}
| {
    type: 'Jump';
    data: { to: number };
}
| {
    type: 'Jumpi';
    data: { true_to: number; false_to: number };
}
| {
    type: 'DynamicJump';
    data: { to: DynamicJump };
}
| {
    type: 'DynamicJumpi';
    data: { true_to: DynamicJump, false_to: number};
}
);



/**
Represents a dynamic jump destination in the control flow
 * @property path - Path of block IDs leading to this jump
 * @property to - Destination block ID if known; use Block.start to get the bytecode offset
 */
export type DynamicJump = {
    path: number[];
    to?: number;
};



/**
Represents the control flow graph of the contract bytecode
 * @property blocks - List of basic blocks in the control flow graph
 */
export type ControlFlowGraph = {
    blocks: Block[],
};



/**
 * Analyzes contract bytecode and returns contract information based on specified options.
 *
 * @param code - Runtime bytecode as a hex string
 * @param args - Configuration options for the analysis
 * @param args.selectors - When true, includes function selectors in the output
 * @param args.arguments - When true, includes function arguments information
 * @param args.stateMutability - When true, includes state mutability information for functions
 * @param args.storage - When true, includes persistent and transient storage layout information
 * @param args.disassemble - When true, includes disassembled bytecode
 * @param args.basicBlocks - When true, includes basic block analysis
 * @param args.controlFlowGraph - When true, includes control flow graph analysis
 * @param args.metadata - When true, extracts terminal CBOR metadata
 * @returns Analyzed contract information
 */
export function contractInfo(code: string, args: {
    selectors?: boolean,
    arguments?: boolean,
    stateMutability?: boolean,
    storage?: boolean,
    disassemble?: boolean,
    basicBlocks?: boolean,
    controlFlowGraph?: boolean,
    metadata?: boolean
}): Contract;



/**
 * Contains the analysis results of a contract
 * @property functions - Array of functions found in the contract. Not present if no functions were extracted.
 * @property storage - Array of persistent storage records found in the contract. Not present if storage layout was not extracted.
 * @property transientStorage - Array of transient storage records found in the contract. Not present if storage layout was not extracted.
 * @property disassembled - Array of bytecode instructions, where each element is a tuple of [offset: number, instruction: string]
 * @property basicBlocks - Array of basic blocks found in the contract. Not present if basic blocks were not analyzed.
 * @property controlFlowGraph - Control flow graph representation. Not present if CFG was not generated.
 * @property metadata - Terminal CBOR metadata. Not present unless requested and valid.
 * @see ContractFunction
 * @see StorageRecord
 */
export type Contract = {
    functions?: ContractFunction[],
    storage?: StorageRecord[],
    transientStorage?: StorageRecord[],
    disassembled?: [number, string][],
    basicBlocks?: [number, number][],
    controlFlowGraph?: ControlFlowGraph,
    metadata?: CborMetadata,
};



/**
 * Represents a function found in the contract bytecode
 * @property selector - Function selector as a 4-byte hex string without '0x' prefix (e.g., 'aabbccdd').
 * @property bytecodeOffset - Starting byte offset within the EVM bytecode for the function body.
 * @property dispatch - Whether the selector is handled by the normal ABI dispatcher or fallback dispatch logic.
 * @property arguments - Function argument types in canonical format (e.g., 'uint256,address[]'). Not present if arguments were not extracted
 * @property stateMutability - Function's state mutability ("pure", "view", "payable", or "nonpayable"). Not present if state mutability were not extracted
 */
export type ContractFunction = {
    selector: string,
    bytecodeOffset: number,
    dispatch: 'abi' | 'fallback',
    arguments?: string,
    stateMutability?: string,
};



/**
 * Represents a storage record found in the contract
 * @property slot - Storage slot number as a hex string (e.g., '0', '1b').
 * @property offset - Byte offset within the storage slot (0-31).
 * @property type - Variable type (e.g., 'uint256', 'mapping(address => uint256)', 'bytes32').
 * @property reads - Array of function selectors that read from this storage location.
 * @property writes - Array of function selectors that write to this storage location.
 */
export type StorageRecord = {
    slot: string,
    offset: number,
    type: string,
    reads: string[],
    writes: string[]
};



export type CborMetadata = {
    bytecodeOffset: number,
    cborLength: number,
    entries: CborEntry[],
};
export type CborEntry = { key: string, value: CborValue };
export type CborValue =
| { type: 'string', value: string }
| { type: 'integer', value: number }
| { type: 'bytes', value: string }
| { type: 'bool', value: boolean }
| { type: 'undecoded', value: string };



/**
 * @typedef {Object} Block
 * @description Represents a basic block in the control flow graph
 * @property {number} id - Unique block identifier (CFG key)
 * @property {number} start - Byte offset where the block's first opcode begins
 * @property {number} end - Byte offset where the block's last opcode begins
 * @property {('Terminate'|'Jump'|'Jumpi'|'DynamicJump'|'DynamicJumpi')} type - Block type
 * @property {(DataTerminate|DataJump|DataJumpi|DataDynamicJump|DataDynamicJumpi)} data - Type Type-specific block data
 */
export function dummy_block(): void;

/**
 * @typedef {Object} DataDynamicJump
 * @property {DynamicJump} to - Possible computed jump destinations
 */
export function dummy_block_data_dynamic_jump(): void;

/**
 * @typedef {Object} DataDynamicJumpi
 * @property {DynamicJump} true_to - Possible computed jump destinations if true
 * @property {number} false_to - Destination block ID if condition is false; use Block.start to get the bytecode offset
 */
export function dummy_block_data_dynamic_jumpi(): void;

/**
 * @typedef {Object} DataJump
 * @property {number} to - Destination block ID; use Block.start to get the bytecode offset
 */
export function dummy_block_data_jump(): void;

/**
 * @typedef {Object} DataJumpi
 * @property {number} true_to - Destination block ID if condition is true; use Block.start to get the bytecode offset
 * @property {number} false_to - Destination block ID if condition is false; use Block.start to get the bytecode offset
 */
export function dummy_block_data_jumpi(): void;

/**
 * @typedef {Object} DataTerminate
 * @property {boolean} success - true for normal termination (STOP/RETURN), false for REVERT/INVALID
 */
export function dummy_block_data_terminate(): void;

/**
 * @typedef {Object} CborEntry
 * @property {string} key
 * @property {CborValue} value
 */
export function dummy_cbor_entry(): void;

/**
 * @typedef {Object} CborMetadata
 * @property {number} bytecodeOffset - Absolute byte offset of the CBOR payload
 * @property {number} cborLength - CBOR payload length, excluding the two-byte suffix
 * @property {Array<CborEntry>} entries - Entries having text-string keys; other keys are skipped
 */
export function dummy_cbor_metadata(): void;

/**
 * @typedef {Object} CborValue
 * @property {('string'|'integer'|'bytes'|'bool'|'undecoded')} type
 * @property {(string|number|boolean)} value - Decoded scalar or lowercase hex-encoded CBOR bytes
 */
export function dummy_cbor_value(): void;

/**
 * @typedef {Object} Contract
 * @description Contains the analysis results of a contract
 * @property {ContractFunction[]} [functions] - Array of functions found in the contract. Not present if no functions were extracted
 * @property {StorageRecord[]} [storage] - Array of persistent storage records found in the contract. Not present if storage layout was not extracted
 * @property {StorageRecord[]} [transientStorage] - Array of transient storage records found in the contract. Not present if storage layout was not extracted
 * @property {Array<Array<number|string>>} [disassembled] - Array of bytecode instructions, where each element is [offset, instruction]
 * @property {Array<Array<number>>} [basicBlocks] - Array of basic blocks found in the contract. Not present if basic blocks were not analyzed.
 * @property {ControlFlowGraph} [controlFlowGraph] - Control flow graph representation. Not present if CFG was not generated.
 * @property {CborMetadata} [metadata] - Terminal CBOR metadata. Not present unless requested and valid.
 */
export function dummy_contract(): void;

/**
 * @typedef {Object} ControlFlowGraph
 * @description Represents the control flow graph of the contract bytecode
 * @property {Block[]} blocks - List of basic blocks in the control flow graph
 */
export function dummy_control_flow_graph(): void;

/**
 * @typedef {Object} DynamicJump
 * @description Represents a dynamic jump destination in the control flow
 * @property {number[]} path - Path of block IDs leading to this jump
 * @property {number} [to] - Destination block ID if known; use Block.start to get the bytecode offset. Optional
 */
export function dummy_dynamic_jump(): void;

/**
 * @typedef {Object} ContractFunction
 * @description Represents a function found in the contract bytecode
 * @property {string} selector - Function selector as a 4-byte hex string without '0x' prefix (e.g., 'aabbccdd')
 * @property {number} bytecodeOffset - Starting byte offset within the EVM bytecode for the function body
 * @property {('abi'|'fallback')} dispatch - Whether the selector is handled by the normal ABI dispatcher or fallback dispatch logic
 * @property {string} [arguments] - Function argument types in canonical format (e.g., 'uint256,address[]'). Not present if arguments were not extracted
 * @property {string} [stateMutability] - Function's state mutability ("pure", "view", "payable", or "nonpayable"). Not present if state mutability were not extracted
 */
export function dummy_function(): void;

/**
 * Represents a storage record found in the contract
 *
 * @typedef {Object} StorageRecord
 * @property {string} slot - Storage slot number as a hex string (e.g., '0', '1b')
 * @property {number} offset - Byte offset within the storage slot (0-31)
 * @property {string} type - Variable type (e.g., 'uint256', 'mapping(address => uint256)', 'bytes32')
 * @property {string[]} reads - Array of function selectors that read from this storage location
 * @property {string[]} writes - Array of function selectors that write to this storage location
 */
export function dummy_storage_record(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly contractInfo: (a: number, b: number, c: number, d: number) => void;
    readonly dummy_block: () => void;
    readonly dummy_block_data_dynamic_jump: () => void;
    readonly dummy_block_data_dynamic_jumpi: () => void;
    readonly dummy_block_data_jump: () => void;
    readonly dummy_block_data_jumpi: () => void;
    readonly dummy_block_data_terminate: () => void;
    readonly dummy_cbor_entry: () => void;
    readonly dummy_cbor_metadata: () => void;
    readonly dummy_cbor_value: () => void;
    readonly dummy_contract: () => void;
    readonly dummy_control_flow_graph: () => void;
    readonly dummy_dynamic_jump: () => void;
    readonly dummy_function: () => void;
    readonly dummy_storage_record: () => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

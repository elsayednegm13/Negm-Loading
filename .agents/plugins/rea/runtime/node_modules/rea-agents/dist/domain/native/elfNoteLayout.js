/** ELF note padding follows binutils: only a declared alignment of 8 uses 8. */
export const elfNoteAlignment = (declared) => declared === 8 || declared === 8n ? 8 : 4;
/** Descriptor and next-note offsets relative to the note's 12-byte header. */
export const elfNoteLayout = (namesz, descsz, alignment) => {
    const descriptor = Math.ceil((12 + namesz) / alignment) * alignment;
    return {
        descriptor,
        next: Math.ceil((descriptor + descsz) / alignment) * alignment,
    };
};

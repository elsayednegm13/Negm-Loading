export const gpuLocation = (source, offset, size) => ({
    container_id: source.containerId,
    offset,
    size,
    section_index: null,
    section_name: null,
});
/** Row identity and both encoded/header locations belong to the same coordinate space. */
export const gpuObject = (source, input) => {
    const { offset, size, kind, metadata = { offset, size: 0 } } = input;
    return {
        id: `${source.containerId ?? "file"}@${metadata.offset.toString(16)}`,
        parent_id: source.containerId,
        kind,
        target: null,
        payload_target: null,
        cuda_target_header: null,
        target_consistency: "unexamined",
        bundle_id: null,
        compression: "none",
        compression_id: null,
        encoded_size: size,
        decoded_size: size,
        sha256: null,
        raw_flags: null,
        location: gpuLocation(source, offset, size),
        metadata_location: gpuLocation(source, metadata.offset, metadata.size),
        inspection: "inventory",
        limitations: [],
    };
};

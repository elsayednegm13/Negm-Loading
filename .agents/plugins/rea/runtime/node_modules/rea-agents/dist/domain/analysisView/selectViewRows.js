/** Preserve original indices and count every match while projecting only the requested page. */
export const selectViewRows = (rows, view, matches, project) => {
    const selected = [];
    let total = 0;
    for (const [index, row] of rows.entries()) {
        if (!matches(row, index))
            continue;
        if (total >= view.offset && selected.length < view.limit)
            selected.push(project(row, index));
        total++;
    }
    return { rows: selected, total };
};

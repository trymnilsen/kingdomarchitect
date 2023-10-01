export type Visitable = {
    children: Visitable[];
}

/**
 * Visit the entity and each of the children and nested
 * children for the given entity. Visits in a breadth first way.
 * @param entity the entity to visit
 * @param visitor the function to run on each visit of an entity.
 *  return true to stop visiting
 */
export function visitChildren(
    visitable: Visitable,
    visitor: (visitable: Visitable) => boolean,
): void {
    const searchEntities = [visitable];

    while (searchEntities.length > 0) {
        // Pick the first entity in the search list
        const visitable = searchEntities.shift();
        if (!visitable) {
            return;
        }
        const shouldStopAfterVisit = visitor(visitable);
        if (shouldStopAfterVisit) {
            break;
        }

        // Add the children of this entity to nodes to search
        for (const child of visitable.children) {
            searchEntities.push(child);
        }
    }
}

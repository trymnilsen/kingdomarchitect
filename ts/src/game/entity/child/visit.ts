import { Entity } from "../entity.ts";

/**
 * Visit the entity and each of the children and nested
 * children for the given entity. Visits in a breadth first way.
 * @param entity the entity to visit
 * @param visitor the function to run on each visit of an entity.
 *  return true to stop visiting
 */
export function visitChildren(
    entity: Entity,
    visitor: (entity: Entity) => boolean,
): void {
    // Breadth-first queue with a moving head index rather than Array.shift().
    // shift() reindexes the whole array on every dequeue, making a full walk
    // O(n^2); advancing a head cursor keeps each dequeue O(1) while preserving
    // the exact breadth-first visit order callers like firstChildWhere and
    // entityWithId depend on.
    const searchEntities = [entity];
    let head = 0;

    while (head < searchEntities.length) {
        const current = searchEntities[head];
        head++;

        const shouldStopAfterVisit = visitor(current);
        if (shouldStopAfterVisit) {
            break;
        }

        // Add the children of this entity to nodes to search
        for (const child of current.children) {
            searchEntities.push(child);
        }
    }
}

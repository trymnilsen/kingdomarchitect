import { Entity } from "../entity";

/**
 * Visit each of the children and nested children for the given entity
 * @param entity the entity to visit
 * @param visitor the function to run on each visit of an entity.
 *  return true to stop visiting
 */
export function visitChildren(
    entity: Entity,
    visitor: (entity: Entity) => boolean
): void {
    const searchEntities = [entity];

    while (searchEntities.length > 0) {
        // Pick the first entity in the search list
        const entity = searchEntities.shift();
        if (!entity) {
            return;
        }
        const shouldStopAfterVisit = visitor(entity);
        if (shouldStopAfterVisit) {
            break;
        }

        // Add the children of this entity to nodes to search
        for (const child of entity.children) {
            searchEntities.push(child);
        }
    }
}

import { Entity } from "../entity.js";
import { visitChildren } from "./visit.js";

/**
 * Find the first child on the entity, or the entity itself that satisfies the
 * given predicate
 * @param entity the entity to start checking on
 * @param predicate the predicate to test children with
 * @returns the first match of the predicate, null if none
 */
export function firstChildWhere(
    entity: Entity,
    predicate: (child: Entity) => boolean,
): Entity | null {
    let firstChild: Entity | null = null;
    visitChildren(entity, (child) => {
        if (predicate(child)) {
            firstChild = child;
            return true;
        } else {
            return false;
        }
    });

    return firstChild;
}

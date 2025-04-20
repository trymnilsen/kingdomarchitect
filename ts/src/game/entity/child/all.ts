import { Entity } from "../entity.js";
import { visitChildren } from "./visit.js";

/**
 * Visit the entity and all its children and create an array with the
 * values returned from the selector method
 * @param entity the entity to start checking on
 * @param predicate the predicate to test children with
 * @returns the first match of the predicate, null if none
 */
export function allChilren(entity: Entity): Entity[] {
    const values: Entity[] = [];
    visitChildren(entity, (child) => {
        values.push(child);
        return false;
    });

    return values;
}

import { Entity } from "../entity.ts";
import { visitChildren } from "./visit.ts";

/**
 * Visit the entity and all its children and create an array with the
 * values returned from the selector method
 * @param entity the entity to start checking on
 * @param predicate the predicate to test children with
 * @returns the first match of the predicate, null if none
 */
export function selectFromChild<T>(
    entity: Entity,
    selector: (child: Entity) => T | null,
): T[] {
    const values: T[] = [];
    visitChildren(entity, (child) => {
        const value = selector(child);
        if (!!value) {
            values.push(value);
        }

        return false;
    });

    return values;
}

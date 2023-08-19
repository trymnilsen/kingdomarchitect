import { Entity } from "../entity.js";
import { firstChildWhere } from "./first.js";

export function entityWithId(entity: Entity, id: string): Entity | null {
    return firstChildWhere(entity, (child) => {
        return child.id === id;
    });
}

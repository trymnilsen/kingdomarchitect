import { Entity } from "../entity.js";
import { firstChildWhere } from "./first.js";

//TODO: We can perhaps make a map of the ones visited to easy lookup
export function entityWithId(entity: Entity, id: string): Entity | null {
    return firstChildWhere(entity, (child) => {
        return child.id === id;
    });
}

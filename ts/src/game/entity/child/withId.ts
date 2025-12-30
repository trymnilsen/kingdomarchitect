import { Entity } from "../entity.ts";
import { firstChildWhere } from "./first.ts";

//TODO: We can perhaps make a map of the ones visited to easy lookup
export function entityWithId(entity: Entity, id: string): Entity | null {
    return firstChildWhere(entity, (child) => {
        return child.id === id;
    });
}

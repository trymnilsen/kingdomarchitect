import type { Entity } from "../entity/entity.ts";

export const overWorldId = "overworld";
export function getOverworldEntity(root: Entity): Entity {
    const overworld = root.children.find((child) => child.id == overWorldId);
    if (!overworld) {
        throw new Error("Root had no overworld entity");
    }

    return overworld;
}

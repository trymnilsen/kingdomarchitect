import { GoblinUnitComponentId } from "./goblinUnitComponent.ts";
import type { Entity } from "../entity/entity.ts";

/**
 * Whether an entity is hostile to the player. Today that means it is a goblin
 * unit, so code asking about hostility asks here rather than testing
 * GoblinUnitComponentId. A direct test of that component should mean literally
 * "is a goblin", as loot tables and camp bookkeeping do.
 */
export function isHostileToPlayer(entity: Entity): boolean {
    return entity.hasComponent(GoblinUnitComponentId);
}

/**
 * Every entity currently hostile to the player. Here for the same reason as
 * {@link isHostileToPlayer}.
 */
export function collectHostileEntities(root: Entity): Entity[] {
    const hostiles: Entity[] = [];
    for (const [entity] of root.queryComponents(GoblinUnitComponentId)) {
        hostiles.push(entity);
    }
    return hostiles;
}

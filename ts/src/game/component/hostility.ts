import { GoblinUnitComponentId } from "./goblinUnitComponent.ts";
import type { Entity } from "../entity/entity.ts";

/**
 * Whether an entity is hostile to the player. Today that means "is a goblin
 * unit", but hostility will outgrow that (factions, wildlife), so every
 * consumer that means "hostile" routes through this function. No other file
 * may test `GoblinUnitComponentId` to mean "hostile". Call sites that test it
 * directly must mean literally "is a goblin", such as loot tables or camp
 * bookkeeping.
 */
export function isHostileToPlayer(entity: Entity): boolean {
    return entity.hasComponent(GoblinUnitComponentId);
}

/**
 * Every entity currently hostile to the player. Enumeration lives here for the
 * same reason as {@link isHostileToPlayer}: when hostility outgrows "is a
 * goblin", only this file changes.
 */
export function collectHostileEntities(root: Entity): Entity[] {
    const hostiles: Entity[] = [];
    for (const [entity] of root.queryComponents(GoblinUnitComponentId)) {
        hostiles.push(entity);
    }
    return hostiles;
}

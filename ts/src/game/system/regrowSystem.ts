import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import type { Entity } from "../entity/entity.ts";
import { ResourceComponentId } from "../component/resourceComponent.ts";
import { RegrowComponentId } from "../component/regrowComponent.ts";
import { getResourceById } from "../../data/inventory/items/naturalResource.ts";
import { SpriteComponentId } from "../component/spriteComponent.ts";

export const regrowSystem = {
    onUpdate: update,
} satisfies EcsSystem;

/**
 * System that handles resource regrowth
 * Checks entities with RegrowComponent that have been harvested and restores them after their regrow time
 *
 * @param root The root entity to search for regrowing resources
 * @param currentTick The current game tick
 */
function update(root: Entity, currentTick: number): void {
    // Query all entities with RegrowComponent
    const regrowingEntitiesMap = root.queryComponents(RegrowComponentId);

    for (const [entity, regrowComponent] of regrowingEntitiesMap) {
        // Skip if never harvested
        if (regrowComponent.harvestedAtTick < 0) {
            continue;
        }

        // Must have resource component too
        const resourceComponent = entity.getEcsComponent(ResourceComponentId);
        if (!resourceComponent) {
            continue;
        }
        const resource = getResourceById(regrowComponent.resourceId);
        if (!resource) {
            console.error(
                `Resource not found for regrow: ${regrowComponent.resourceId}`,
            );
            continue;
        }

        if (resource.lifecycle.type !== "Regrow") {
            console.error(
                `Resource ${regrowComponent.resourceId} does not have Regrow lifecycle`,
            );
            continue;
        }

        // Check if enough time has passed
        const ticksSinceHarvest = currentTick - regrowComponent.harvestedAtTick;
        if (ticksSinceHarvest >= resource.lifecycle.time) {
            // Restore resource - mark as not harvested
            regrowComponent.harvestedAtTick = -1;
            entity.invalidateComponent(RegrowComponentId);

            // Restore sprite to normal (not depleted)
            const spriteComponent = entity.getEcsComponent(SpriteComponentId);
            if (spriteComponent) {
                spriteComponent.sprite = resource.asset;
                entity.invalidateComponent(SpriteComponentId);
            }
        } else {
            // Still regrowing - update sprite to show depleted state if needed
            if (resource.lifecycle.sprite) {
                const spriteComponent =
                    entity.getEcsComponent(SpriteComponentId);
                if (
                    spriteComponent &&
                    spriteComponent.sprite.id !== resource.lifecycle.sprite.id
                ) {
                    spriteComponent.sprite = resource.lifecycle.sprite;
                    entity.invalidateComponent(SpriteComponentId);
                }
            }
        }
    }
}

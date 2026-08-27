import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import { log } from "../../common/logging/logger.ts";
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
    const regrowingEntitiesMap = root.queryComponents(RegrowComponentId);

    for (const [entity, regrowComponent] of regrowingEntitiesMap) {
        // A negative harvest tick means the resource is standing, not regrowing.
        if (regrowComponent.harvestedAtTick < 0) {
            continue;
        }

        const resourceComponent = entity.getEcsComponent(ResourceComponentId);
        if (!resourceComponent) {
            continue;
        }
        const resource = getResourceById(regrowComponent.resourceId);
        if (!resource) {
            log.error("Resource not found for regrow", {
                resourceId: regrowComponent.resourceId,
            });
            continue;
        }

        if (resource.lifecycle.type !== "Regrow") {
            log.error("Resource does not have Regrow lifecycle", {
                resourceId: regrowComponent.resourceId,
            });
            continue;
        }

        const ticksSinceHarvest = currentTick - regrowComponent.harvestedAtTick;
        if (ticksSinceHarvest >= resource.lifecycle.time) {
            regrowComponent.harvestedAtTick = -1;
            entity.invalidateComponent(RegrowComponentId);

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
                    spriteComponent.sprite.spriteId !==
                        resource.lifecycle.sprite.spriteId
                ) {
                    spriteComponent.sprite = resource.lifecycle.sprite;
                    entity.invalidateComponent(SpriteComponentId);
                }
            }
        }
    }
}

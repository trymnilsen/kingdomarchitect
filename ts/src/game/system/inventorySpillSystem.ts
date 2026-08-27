import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import { log } from "../../common/logging/logger.ts";
import { scatterInventory } from "../behavior/scatterInventory.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { InventoryComponentId } from "../component/inventoryComponent.ts";
import { DeathGameEventType } from "../entity/event/deathGameEventData.ts";
import type { GameTime } from "../gameTime.ts";

/**
 * Spills the contents of anything that dies holding stored goods: a stockpile
 * razed in a raid, a scaffold destroyed with its delivered materials inside.
 * The goods land around the wreck instead of vanishing, so a raid costs the
 * player the building and the hauling work rather than the resources.
 *
 * The trigger is any dying entity with a non-empty inventory, not stockpiles
 * specifically, so other stores are covered without a second system. Units
 * carry goods in their held slot and spill through lootDropSystem instead.
 *
 * damageEntity bubbles the death event before removing the entity, so the
 * inventory is still readable here and the dying building's footprint still
 * blocks placement. That is why the goods ring the wreck instead of piling up
 * underneath it.
 */
export function createInventorySpillSystem(gameTime: GameTime): EcsSystem {
    return {
        onEntityEvent: {
            game: (root, event) => {
                if (event.data.type !== DeathGameEventType) {
                    return;
                }
                const dead = event.source;
                const inventory = dead.getEcsComponent(InventoryComponentId);
                if (!inventory || inventory.items.length === 0) {
                    return;
                }

                const name =
                    dead.getEcsComponent(BuildingComponentId)?.building.name ??
                    "building";

                const scattered = scatterInventory(
                    root,
                    gameTime.tick,
                    dead,
                    `spilled from destroyed ${name}`,
                );

                log.info("Destroyed store spilled its contents", {
                    entityId: dead.id,
                    stacks: inventory.items.length,
                    scattered,
                });
            },
        },
    };
}

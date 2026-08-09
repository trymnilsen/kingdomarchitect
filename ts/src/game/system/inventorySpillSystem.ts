import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import { log } from "../../common/logging/logger.ts";
import { scatterInventory } from "../behavior/scatterInventory.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { InventoryComponentId } from "../component/inventoryComponent.ts";
import { DeathGameEventType } from "../entity/event/deathGameEventData.ts";
import type { GameTime } from "../gameTime.ts";

/**
 * Spills the contents of anything that dies holding stored goods — a stockpile
 * razed in a raid, a scaffold destroyed with its delivered materials still
 * inside. The goods land on the ground around the wreck instead of vanishing
 * with the entity, so a raid costs the player the building and the hauling
 * work, not the resources themselves.
 *
 * Triggers on any dying entity with a non-empty inventory rather than on
 * stockpiles specifically, so chests and other future stores inherit this
 * without a second system. Units carry goods in their held slot instead and
 * spill through lootDropSystem; an entity with both spills through both.
 *
 * The death event is bubbled before the entity is removed (see damageEntity),
 * so the inventory is still readable here, and the dying entity's own footprint
 * still blocks placement — which is why the goods ring the collapsing building
 * rather than piling up underneath it.
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

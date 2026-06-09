import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { log } from "../../common/logging/logger.ts";
import { StockpileComponentId } from "../component/stockpileComponent.ts";
import { InventoryComponentId } from "../component/inventoryComponent.ts";
import { DeathGameEventType } from "../entity/event/deathGameEventData.ts";

/**
 * Logs the contents of a stockpile when it is destroyed (e.g. razed during a
 * goblin raid). Those goods are gone — the entity and its inventory are removed
 * with the building — so this is purely a debugging trail for later balancing
 * of how much a raid actually costs the player.
 *
 * The death event is bubbled before the entity is removed (see damageEntity),
 * so the inventory is still readable here.
 */
export const stockpileDestructionSystem: EcsSystem = {
    onEntityEvent: {
        game: (_root, event) => {
            if (event.data.type !== DeathGameEventType) {
                return;
            }
            const dead = event.source;
            if (!dead.hasComponent(StockpileComponentId)) {
                return;
            }
            const inventory = dead.getEcsComponent(InventoryComponentId);
            const lost = (inventory?.items ?? []).map((entry) => ({
                id: entry.item.id,
                amount: entry.amount,
            }));
            log.info("Stockpile destroyed, contents lost", {
                stockpileId: dead.id,
                lost,
            });
        },
    },
};

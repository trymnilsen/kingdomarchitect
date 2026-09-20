import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import { log } from "../../common/logging/logger.ts";
import { getLootTable, rollLootDrops } from "../../data/loot/lootTable.ts";
import { dropItemAtPosition, DropMode } from "../behavior/dropItem.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../component/heldItemComponent.ts";
import { LootComponentId } from "../component/lootComponent.ts";
import { DeathGameEventType } from "../entity/event/deathGameEventData.ts";
import type { GameTime } from "../gameTime.ts";

/**
 * Drops what a slain creature was carrying and whatever its loot table says it
 * leaves behind.
 *
 * What drops is read off the dying entity's LootComponent, so a goblin and a
 * boar take the same path and a new creature needs no branch here.
 *
 * Takes the game time because entity events carry no tick, and the piles it
 * creates need one to start their decay clock.
 */
export function createLootDropSystem(gameTime: GameTime): EcsSystem {
    return {
        onEntityEvent: {
            game: (root, event) => {
                if (event.data.type !== DeathGameEventType) return;

                const loot = event.source.getEcsComponent(LootComponentId);
                if (!loot) return;

                const table = getLootTable(loot.lootTableId);
                if (!table) {
                    log.warn("No loot table for slain entity", {
                        entityId: event.source.id,
                        lootTableId: loot.lootTableId,
                    });
                    return;
                }

                const deathPosition = event.source.worldPosition;
                const tick = gameTime.tick;
                const slain = table.sourceName.toLowerCase();

                for (const drop of rollLootDrops(table)) {
                    dropItemAtPosition(
                        root,
                        tick,
                        deathPosition,
                        drop.item,
                        drop.amount,
                        `${drop.item.name} dropped as loot by ${slain} (${event.source.id})`,
                        DropMode.Nearest,
                    );
                }

                const held = event.source.getEcsComponent(HeldItemComponentId);
                if (held && !isHeldEmpty(held)) {
                    dropItemAtPosition(
                        root,
                        tick,
                        deathPosition,
                        held.item!,
                        held.amount,
                        `${held.item!.name} dropped as loot by ${slain} (${event.source.id})`,
                        DropMode.Nearest,
                    );
                }
            },
        },
    };
}

import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import { goldCoins } from "../../data/inventory/items/resources.ts";
import { dropItemAtPosition, DropMode } from "../behavior/dropItem.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../component/heldItemComponent.ts";
import { GoblinUnitComponentId } from "../component/goblinUnitComponent.ts";
import { DeathGameEventType } from "../entity/event/deathGameEventData.ts";
import type { GameTime } from "../gameTime.ts";

/**
 * Drops a slain goblin's purse and whatever it was carrying.
 *
 * Takes the game time because entity events carry no tick, and the piles it
 * creates need one to start their decay clock.
 */
export function createLootDropSystem(gameTime: GameTime): EcsSystem {
    return {
        onEntityEvent: {
            game: (root, event) => {
                if (event.data.type !== DeathGameEventType) return;
                if (!event.source.getEcsComponent(GoblinUnitComponentId))
                    return;

                const deathPosition = event.source.worldPosition;
                const tick = gameTime.tick;

                dropItemAtPosition(
                    root,
                    tick,
                    deathPosition,
                    goldCoins,
                    1,
                    `Gold dropped as loot by slain goblin (${event.source.id})`,
                    DropMode.Nearest,
                );

                const held = event.source.getEcsComponent(HeldItemComponentId);
                if (held && !isHeldEmpty(held)) {
                    dropItemAtPosition(
                        root,
                        tick,
                        deathPosition,
                        held.item!,
                        held.amount,
                        `${held.item!.name} dropped as loot by slain goblin (${event.source.id})`,
                        DropMode.Nearest,
                    );
                }
            },
        },
    };
}

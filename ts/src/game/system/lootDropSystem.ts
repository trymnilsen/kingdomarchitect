import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { goldCoins } from "../../data/inventory/items/resources.ts";
import { dropItemAtPosition, DropMode } from "../behavior/dropItem.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../component/heldItemComponent.ts";
import { GoblinUnitComponentId } from "../component/goblinUnitComponent.ts";
import { DeathGameEventType } from "../entity/event/deathGameEventData.ts";

export const lootDropSystem: EcsSystem = {
    onEntityEvent: {
        game: (root, event) => {
            if (event.data.type !== DeathGameEventType) return;
            if (!event.source.getEcsComponent(GoblinUnitComponentId)) return;

            const deathPosition = event.source.worldPosition;

            dropItemAtPosition(root, deathPosition, goldCoins, 1, DropMode.Nearest);

            const held = event.source.getEcsComponent(HeldItemComponentId);
            if (held && !isHeldEmpty(held)) {
                dropItemAtPosition(root, deathPosition, held.item!, held.amount, DropMode.Nearest);
            }
        },
    },
};

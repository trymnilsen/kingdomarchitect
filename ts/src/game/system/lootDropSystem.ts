import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { goldCoins } from "../../data/inventory/items/resources.ts";
import { dropItemAtPosition, findDropPosition } from "../behavior/dropItem.ts";
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

            dropItemAtPosition(root, deathPosition, goldCoins, 1);

            const held = event.source.getEcsComponent(HeldItemComponentId);
            if (held && !isHeldEmpty(held)) {
                const heldDrop =
                    findDropPosition(root, deathPosition, held.item!) ??
                    deathPosition;
                dropItemAtPosition(root, heldDrop, held.item!, held.amount);
            }
        },
    },
};

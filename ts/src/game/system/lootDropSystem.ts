import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { goldCoins } from "../../data/inventory/items/resources.ts";
import { GoblinUnitComponentId } from "../component/goblinUnitComponent.ts";
import { addJob, JobQueueComponentId } from "../component/jobQueueComponent.ts";
import { DeathGameEventType } from "../entity/event/deathGameEventData.ts";
import { CollectItemJob } from "../job/collectItemJob.ts";
import { collectableItemPrefab } from "../prefab/collectableItemPrefab.ts";
import { findPlayerKingdom } from "./jobNotificationSystem.ts";

export const lootDropSystem: EcsSystem = {
    onEntityEvent: {
        game: (root, event) => {
            if (event.data.type !== DeathGameEventType) return;
            if (!event.source.getEcsComponent(GoblinUnitComponentId)) return;

            const deathPosition = event.source.worldPosition;
            const loot = collectableItemPrefab(goldCoins, 1);
            root.addChild(loot);
            loot.worldPosition = deathPosition;
        },
    },
};

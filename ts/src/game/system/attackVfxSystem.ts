import type { GameTime } from "../../common/time.ts";
import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { EventGameMessageType } from "../../server/message/gameMessage.ts";
import {
    AttackGameEventType,
    type AttackGameEventData,
} from "../entity/event/attackGameEventData.ts";
import { swipeVfxPrefab } from "../prefab/swipeVfxPrefab.ts";

export function createAttackVfxSystem(gameTime: GameTime): EcsSystem {
    return {
        onGameMessage: (root, message) => {
            if (message.type !== EventGameMessageType) return;
            if (message.eventType !== AttackGameEventType) return;

            const payload = message.payload as AttackGameEventData;
            const target = root.findEntity(payload.target);
            if (!target) return;

            const vfx = swipeVfxPrefab(gameTime.tick);
            root.addChild(vfx);
            vfx.worldPosition = target.worldPosition;
        },
    };
}

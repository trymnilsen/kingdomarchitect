import type { GameTime } from "../gameTime.ts";
import type { EcsSystem } from "../../ecs/ecsSystem.ts";
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

            const vfx = swipeVfxPrefab(gameTime.tick);
            root.addChild(vfx);
            vfx.worldPosition = payload.impact;
        },
    };
}

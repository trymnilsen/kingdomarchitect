import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { createLogger } from "../../common/logging/logger.ts";
import { EventGameMessageType } from "../../server/message/gameMessage.ts";
import { AttackGameEventType } from "../entity/event/attackGameEventData.ts";

const log = createLogger("attack-event");

export const attackEventLogSystem: EcsSystem = {
    onGameMessage: (_root, message) => {
        if (message.type !== EventGameMessageType) return;
        if (message.eventType !== AttackGameEventType) return;
        log.info("attack", { payload: message.payload });
    },
};

import type { Entity } from "../entity.ts";
import type { EntityGameEvent } from "./entityGameEvent.ts";

export const DeathGameEventType = "death";

export type DeathGameEventData = {
    entityId: string;
};

export type DeathGameEvent = EntityGameEvent & {
    data: { type: typeof DeathGameEventType; payload: DeathGameEventData };
};

export function createDeathGameEvent(
    source: Entity,
    entityId: string,
): DeathGameEvent {
    return {
        id: "game",
        source,
        data: {
            type: DeathGameEventType,
            payload: { entityId },
        },
    };
}

import type { Entity } from "../entity.ts";
import type { EntityGameEvent } from "./entityGameEvent.ts";

export const AttackGameEventType = "attack";

export type AttackGameEventData = {
    attacker: string;
    target: string;
};

export type AttackGameEvent = EntityGameEvent & {
    data: { type: typeof AttackGameEventType; payload: AttackGameEventData };
};

export function createAttackGameEvent(
    source: Entity,
    attacker: string,
    target: string,
): AttackGameEvent {
    return {
        id: "game",
        source,
        data: {
            type: AttackGameEventType,
            payload: { attacker, target },
        },
    };
}

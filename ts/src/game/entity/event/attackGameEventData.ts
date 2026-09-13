import type { Point } from "../../../common/point.ts";
import type { Entity } from "../entity.ts";
import type { EntityGameEvent } from "./entityGameEvent.ts";

export const AttackGameEventType = "attack";

/**
 * A blow that already landed. Carries the struck tile and not the struck
 * entity, since a tile can be aimed at and the victim of a killing blow is
 * already gone
 */
export type AttackGameEventData = {
    impact: Point;
};

export type AttackGameEvent = EntityGameEvent & {
    data: { type: typeof AttackGameEventType; payload: AttackGameEventData };
};

export function createAttackGameEvent(
    source: Entity,
    impact: Point,
): AttackGameEvent {
    return {
        id: "game",
        source,
        data: {
            type: AttackGameEventType,
            payload: { impact },
        },
    };
}

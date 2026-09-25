import type { Point } from "../../../common/point.ts";
import type { Entity } from "../entity.ts";
import type { EntityGameEvent } from "./entityGameEvent.ts";

export const GroundDiscoveredGameEventType = "groundDiscovered";

export type GroundDiscoveredGameEventData = {
    player: string;
    discoveredTiles: Point[];
    generatedChunks: Point[];
};

export type GroundDiscoveredGameEvent = EntityGameEvent & {
    data: {
        type: typeof GroundDiscoveredGameEventType;
        payload: GroundDiscoveredGameEventData;
    };
};

export function createGroundDiscoveredGameEvent(
    source: Entity,
    payload: GroundDiscoveredGameEventData,
): GroundDiscoveredGameEvent {
    return {
        id: "game",
        source,
        data: {
            type: GroundDiscoveredGameEventType,
            payload,
        },
    };
}

export function isGroundDiscoveredGameEvent(
    event: EntityGameEvent,
): event is GroundDiscoveredGameEvent {
    return event.data.type === GroundDiscoveredGameEventType;
}

import type { Entity } from "../../../game/entity/entity.ts";
import type { StationPriority } from "../../../game/component/stationComponent.ts";

export type SetStationPriorityCommand = {
    id: typeof SetStationPriorityCommandId;
    tower: string;
    priority: StationPriority;
};

export function SetStationPriorityCommand(
    tower: Entity,
    priority: StationPriority,
): SetStationPriorityCommand {
    return {
        id: SetStationPriorityCommandId,
        tower: tower.id,
        priority,
    };
}

export const SetStationPriorityCommandId = "setStationPriority";

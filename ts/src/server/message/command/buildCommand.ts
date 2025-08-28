import type { Point } from "../../../common/point.js";
import type { Building } from "../../../data/building/building.js";
import type { Job, Jobs } from "../../../game/job/job.js";
import type { GameCommand } from "../gameCommand.js";

export type BuildCommand = {
    id: typeof BuildCommandId;
    buildingId: string;
    position: Point | Point[];
};

export function BuildCommand(
    building: Building,
    position: Point | Point[],
): BuildCommand {
    return {
        id: BuildCommandId,
        buildingId: building.id,
        position,
    };
}

export const BuildCommandId = "build";

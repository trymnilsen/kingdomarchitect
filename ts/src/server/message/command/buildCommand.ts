import type { Point } from "../../../common/point.ts";
import type { Building } from "../../../data/building/building.ts";
import type { Job, Jobs } from "../../../game/job/job.ts";
import type { GameCommand } from "../gameCommand.ts";

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

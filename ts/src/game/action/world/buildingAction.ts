import type { Point } from "../../../common/point.js";
import type { Building } from "../../../data/building/building.js";
import type { EntityAction } from "../../../module/action/entityAction.js";

export interface BuildBuildingAction extends EntityAction {
    building: Building;
    position: Point;
}

export function makeBuildBuildingAction(
    building: Building,
    position: Point,
): BuildBuildingAction {
    return {
        id: ["building", BuildBuildingId],
        position,
        building,
    };
}

export const BuildBuildingId = "build";

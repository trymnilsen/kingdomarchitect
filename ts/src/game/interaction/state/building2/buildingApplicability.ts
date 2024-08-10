import { Point } from "../../../../common/point.js";
import { Entity } from "../../../entity/entity.js";

export type BuildingApplicableSuccessResult = {
    isApplicable: true;
};

export type BuildingApplicableErrorResult = {
    isApplicable: false;
    reason: string;
};

export type BuildingApplicabilityResult =
    | BuildingApplicableSuccessResult
    | BuildingApplicableErrorResult;

export type BuildingApplicability = (
    position: Point,
    world: Entity,
) => BuildingApplicabilityResult;

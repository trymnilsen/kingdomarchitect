import { Point } from "../../../../common/point.ts";
import { Entity } from "../../../entity/entity.ts";

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

import type { Point } from "../../common/point.js";
import { PathResultStatus, queryPath } from "../../module/query/pathQuery.js";
import type { Entity } from "../entity/entity.js";

export enum MovementResult {
    Ok = "ok",
    Failure = "failure",
}

export function doMovement(entity: Entity, to: Point): MovementResult {
    const root = entity.getRootEntity();
    const path = queryPath(root, entity.worldPosition, to);
    const nextPoint = path.path.shift();
    if (path.status == PathResultStatus.Complete && !!nextPoint) {
        entity.worldPosition = nextPoint;
        return MovementResult.Ok;
    } else {
        return MovementResult.Failure;
    }
}

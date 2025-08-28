import type { Point } from "../../common/point.js";
import { PathResultStatus, queryPath } from "../map/query/pathQuery.js";
import type { Entity } from "../entity/entity.js";
import { VisibilityComponentId } from "../component/visibilityComponent.js";
import { offsetPatternWithPoint } from "../../common/pattern.js";
import { setDiscoveryForPlayer } from "../system/worldGenerationSystem.js";
import {
    DirectionComponentId,
    updateDirectionComponent,
} from "../component/directionComponent.js";

export enum MovementResult {
    Ok = "ok",
    Failure = "failure",
}

export function doMovement(entity: Entity, to: Point): MovementResult {
    const root = entity.getRootEntity();
    const path = queryPath(root, entity.worldPosition, to);
    const nextPoint = path.path.shift();
    if (nextPoint) {
        discoverAfterMovement(entity, nextPoint);
        entity.updateComponent(DirectionComponentId, (component) => {
            updateDirectionComponent(
                component,
                entity.worldPosition,
                nextPoint,
            );
        });
    }

    if (path.status == PathResultStatus.Complete && !!nextPoint) {
        entity.worldPosition = nextPoint;
        return MovementResult.Ok;
    } else {
        return MovementResult.Failure;
    }
}

export function discoverAfterMovement(entity: Entity, nextPoint: Point) {
    const visibility = entity.getEcsComponent(VisibilityComponentId);
    if (visibility) {
        const points = offsetPatternWithPoint(nextPoint, visibility.pattern);

        setDiscoveryForPlayer(entity.getRootEntity(), "player", points);
    }
}

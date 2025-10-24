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
import { EffectEmitterComponentId } from "../component/effectEmitterComponent.js";
import { SpaceComponentId } from "../component/spaceComponent.js";
import { getPathfindingGraphForEntity } from "../map/path/getPathfindingGraphForEntity.js";

export enum MovementResult {
    Ok = "ok",
    Failure = "failure",
}

export function doMovement(entity: Entity, to: Point): MovementResult {
    const root = entity.getRootEntity();

    // Get the pathfinding graph for the entity's space
    const pathfindingGraph = getPathfindingGraphForEntity(root, entity);
    if (!pathfindingGraph) {
        return MovementResult.Failure;
    }

    const path = queryPath(pathfindingGraph, entity.worldPosition, to);
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

        setDiscoveryForPlayer(
            entity.requireAncestorEntity(SpaceComponentId),
            entity.getRootEntity().requireEcsComponent(EffectEmitterComponentId)
                .emitter,
            "player",
            points,
        );
    }
}

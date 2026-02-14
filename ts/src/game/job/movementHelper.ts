import type { Point } from "../../common/point.ts";
import { PathResultStatus, queryPath } from "../map/query/pathQuery.ts";
import type { Entity } from "../entity/entity.ts";
import { VisibilityComponentId } from "../component/visibilityComponent.ts";
import { offsetPatternWithPoint } from "../../common/pattern.ts";
import { setDiscoveryForPlayer } from "../system/worldGenerationSystem.ts";
import {
    DirectionComponentId,
    updateDirectionComponent,
} from "../component/directionComponent.ts";
import { EffectEmitterComponentId } from "../component/effectEmitterComponent.ts";
import { getPathfindingGraphForEntity } from "../map/path/getPathfindingGraphForEntity.ts";

export const MovementResult = {
    Ok: "ok",
    Failure: "failure",
} as const;

export type MovementResult =
    (typeof MovementResult)[keyof typeof MovementResult];

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

    // Accept both Complete and Partial paths - Partial paths allow moving
    // towards blocked destinations (e.g., resources, buildings)
    const isValidPath =
        path.status === PathResultStatus.Complete ||
        path.status === PathResultStatus.Partial;

    if (isValidPath && !!nextPoint) {
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
        const root = entity.getRootEntity();

        setDiscoveryForPlayer(
            root,
            root.requireEcsComponent(EffectEmitterComponentId).emitter,
            "player",
            points,
        );
    }
}

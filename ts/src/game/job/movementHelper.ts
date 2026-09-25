import type { Point } from "../../common/point.ts";
import {
    PathResultStatus,
    queryPath,
    type QueryPathOptions,
} from "../map/query/pathQuery.ts";
import type { Entity } from "../entity/entity.ts";
import {
    DirectionComponentId,
    updateDirectionComponent,
} from "../component/directionComponent.ts";
import { getPathfindingGraph } from "../map/path/getPathfindingGraph.ts";
import {
    MovementStaminaComponentId,
    recordMove,
} from "../component/movementStaminaComponent.ts";
import { spendEntityEnergy } from "../component/energyComponent.ts";

export const MovementResult = {
    Ok: "ok",
    Failure: "failure",
} as const;

export type MovementResult =
    (typeof MovementResult)[keyof typeof MovementResult];

export function doMovement(
    entity: Entity,
    to: Point,
    options?: QueryPathOptions,
): MovementResult {
    const root = entity.getRootEntity();

    // Get the pathfinding graph for the entity's space
    const pathfindingGraph = getPathfindingGraph(root);
    if (!pathfindingGraph) {
        return MovementResult.Failure;
    }

    const path = queryPath(pathfindingGraph, entity.worldPosition, to, options);
    const nextPoint = path.path.shift();
    if (nextPoint) {
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

export function applyStep(
    entity: Entity,
    from: Point,
    to: Point,
    tick: number,
): void {
    entity.updateComponent(DirectionComponentId, (component) => {
        updateDirectionComponent(component, from, to);
    });
    entity.worldPosition = to;
    const stamina = entity.getEcsComponent(MovementStaminaComponentId);
    if (stamina) {
        recordMove(stamina, tick);
        entity.invalidateComponent(MovementStaminaComponentId);
    }
    spendEntityEnergy(entity, 1);
}

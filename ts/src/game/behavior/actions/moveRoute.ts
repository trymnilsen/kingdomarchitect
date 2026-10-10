/**
 * A walker's route advances only here, so a step on its own turn and a step
 * taken for it in a rotation leave the route in the same state. Planning and
 * dropping a route stay with moveToAction.
 */
import { type Point, pointEquals } from "../../../common/point.ts";
import {
    BehaviorAgentComponentId,
    getBehaviorAgent,
} from "../../component/behaviorAgentComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { applyStep } from "../../job/movementHelper.ts";
import type { MoveToActionData } from "./moveToAction.ts";
import { resolveReach } from "./reach.ts";

export function hasArrived(
    position: Point,
    target: Point,
    isGoal: ((point: Point) => boolean) | undefined,
): boolean {
    if (isGoal) {
        return isGoal(position);
    }
    return pointEquals(position, target);
}

/**
 * The walk this entity will take its next step on, or null when it will not
 * step. A pending replan means it picks a new plan first. A walker already
 * within its goal finishes on its turn instead of stepping, as an attacker
 * does once its target walks into reach.
 */
export function activeRoute(entity: Entity): MoveToActionData | null {
    const agent = getBehaviorAgent(entity);
    if (!agent || agent.pendingReplan !== undefined) {
        return null;
    }
    const action = agent.actionQueue[0];
    if (action?.type !== "moveTo" || !action.cachedPath?.length) {
        return null;
    }
    const isGoal = action.goal
        ? resolveReach(action.goal, entity, action.target)
        : undefined;
    if (hasArrived(entity.worldPosition, action.target, isGoal)) {
        return null;
    }
    return action;
}

export function nextRouteStep(entity: Entity): Point | null {
    return activeRoute(entity)?.cachedPath?.[0] ?? null;
}

/**
 * Take the first step of `route` and drop it from the path. The caller has
 * made sure that step is free to take.
 */
export function stepAlongRoute(
    entity: Entity,
    route: MoveToActionData,
    tick: number,
): void {
    const nextStep = route.cachedPath?.[0];
    if (!nextStep) {
        throw new Error(`${entity.id} has no step left on its route`);
    }
    applyStep(entity, entity.worldPosition, nextStep, tick);
    route.cachedPath = route.cachedPath!.slice(1);
    entity.invalidateComponent(BehaviorAgentComponentId);
}

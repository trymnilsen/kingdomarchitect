import type { Point } from "../../../common/point.ts";
import { resolveTargetPoint } from "../../combat/resolveTarget.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "./actionData.ts";
import type { MoveToActionData } from "./moveToAction.ts";
import { isInReach, type Reach } from "./reach.ts";

/**
 * The place an action is performed from: the point it acts on and how close to
 * that point the entity has to stand.
 */
export type ActionApproach = {
    target: Point;
    reach: Reach;
};

/**
 * The walk that brings `entity` within reach of `action`, or null when it is
 * already there or the action needs no particular place.
 *
 * The behavior system asks this before running an action, which is what lets
 * planners queue the action alone. The walk's goal is the action's own reach,
 * so a walk that completes has always put the action in reach.
 */
export function planApproach(
    action: BehaviorActionData,
    entity: Entity,
): MoveToActionData | null {
    const approach = resolveActionApproach(action, entity);
    if (!approach) {
        return null;
    }
    if (isInReach(approach.reach, entity, approach.target)) {
        return null;
    }
    return {
        type: "moveTo",
        target: approach.target,
        goal: approach.reach,
    };
}

/**
 * Where each action is performed from. Null for actions that happen wherever
 * the entity stands, and for actions whose target has gone: those run anyway
 * and fail with the cause that says so.
 *
 * Exhaustive, so a new action cannot compile until it says what it needs to
 * be close to.
 */
export function resolveActionApproach(
    action: BehaviorActionData,
    entity: Entity,
): ActionApproach | null {
    const root = entity.getRootEntity();
    switch (action.type) {
        case "wait":
        case "moveTo":
        case "stepOff":
        case "holdStation":
        case "clearPlayerCommand":
        case "sleep":
        case "eatFromHeld":
        case "drinkFromHeld":
        case "eatFromEquipment":
        case "equipFromHeld":
            return null;
        case "stepOnto":
            return touchEntity(root, action.targetId);
        case "depositToStockpile":
            return touchEntity(root, action.stockpileId);
        case "withdrawFromStockpile":
            return touchEntity(root, action.stockpileId);
        case "harvestResource":
            return touchEntity(root, action.entityId);
        case "clearObstacle":
            return touchEntity(root, action.entityId);
        case "constructBuilding":
            return touchEntity(root, action.entityId);
        case "dismantleBuilding":
            return touchEntity(root, action.entityId);
        case "takeFromInventory":
            return touchEntity(root, action.sourceEntityId);
        case "depositToInventory":
            return touchEntity(root, action.targetEntityId);
        case "craftItem":
            return touchEntity(root, action.buildingId);
        case "collectItems":
            return touchEntity(root, action.entityId);
        case "plantCrop":
            return touchEntity(root, action.buildingId);
        case "harvestCrop":
            return touchEntity(root, action.buildingId);
        case "stealFood":
            return touchEntity(root, action.targetEntityId);
        case "workWindmill":
            return touchEntity(root, action.windmillId);
        case "pickupFromGround":
            return touchEntity(root, action.pileEntityId);
        case "plantTree":
            return { target: action.targetPosition, reach: { kind: "touch" } };
        case "fish":
            return { target: action.target, reach: { kind: "touch" } };
        case "warmByFire": {
            const fire = root.findEntity(action.fireEntityId);
            if (!fire) {
                return null;
            }
            return { target: fire.worldPosition, reach: { kind: "near" } };
        }
        case "dropHeld":
            if (!action.destination) {
                return null;
            }
            return { target: action.destination, reach: { kind: "on" } };
        case "dropFromSlot":
            return { target: action.destination, reach: { kind: "on" } };
        case "attackTarget": {
            const impact = resolveTargetPoint(root, action.target);
            if (!impact) {
                return null;
            }
            return {
                target: impact,
                reach: { kind: "attack", target: action.target },
            };
        }
        default: {
            const unhandled: never = action;
            return unhandled;
        }
    }
}

function touchEntity(root: Entity, entityId: string): ActionApproach | null {
    const target = root.findEntity(entityId);
    if (!target) {
        return null;
    }
    return { target: target.worldPosition, reach: { kind: "touch" } };
}

import { isAtOrAdjacent, type Point } from "../../../common/point.ts";
import { canAttackFrom } from "../../combat/attackReach.ts";
import type { AttackTarget } from "../../combat/attackTarget.ts";
import { resolveTargetPoint } from "../../combat/resolveTarget.ts";
import { resolveAttackProfile } from "../../combat/resolveAttackProfile.ts";
import type { Entity } from "../../entity/entity.ts";

export type MoveGoal =
    { kind: "adjacent" } | { kind: "attackReach"; target: AttackTarget };

export function resolveMoveGoal(
    goal: MoveGoal,
    entity: Entity,
    destination: Point,
): (point: Point) => boolean {
    if (goal.kind === "adjacent") {
        return (point) => isAtOrAdjacent(point, destination);
    }

    const root = entity.getRootEntity();
    const profile = resolveAttackProfile(entity);
    const impact = resolveTargetPoint(root, goal.target);
    if (!impact) {
        // No tile satisfies the goal, so the move runs out of path and fails
        return () => false;
    }

    return (point) => canAttackFrom(root, profile, point, impact);
}

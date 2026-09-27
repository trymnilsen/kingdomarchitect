import type { AttackTarget } from "../../combat/attackTarget.ts";
import { resolveTargetPoint } from "../../combat/resolveTarget.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/actionData.ts";

// Empty when there is nothing to aim at. Closing in is the attack's own approach
export function planAttack(
    entity: Entity,
    target: AttackTarget,
): BehaviorActionData[] {
    if (!resolveTargetPoint(entity.getRootEntity(), target)) {
        return [];
    }
    return [{ type: "attackTarget", target }];
}

import { canAttackFrom } from "../../combat/attackReach.ts";
import type { AttackTarget } from "../../combat/attackTarget.ts";
import { resolveTargetPoint } from "../../combat/resolveTarget.ts";
import { resolveAttackProfile } from "../../combat/resolveAttackProfile.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/actionData.ts";

export function planAttack(
    entity: Entity,
    target: AttackTarget,
): BehaviorActionData[] {
    const root = entity.getRootEntity();
    const impact = resolveTargetPoint(root, target);
    if (!impact) {
        return [];
    }

    const profile = resolveAttackProfile(entity);
    if (canAttackFrom(root, profile, entity.worldPosition, impact)) {
        return [{ type: "attackTarget", target }];
    }

    return [
        {
            type: "moveTo",
            target: impact,
            goal: { kind: "attackReach", target },
        },
        { type: "attackTarget", target },
    ];
}

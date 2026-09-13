import { log } from "../../../common/logging/logger.ts";
import {
    damageEntity,
    HealthComponentId,
} from "../../component/healthComponent.ts";

import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./action.ts";
import {
    addThreat,
    getTopThreat,
    ThreatMapComponentId,
} from "../../component/threatMapComponent.ts";
import { requestReplan } from "../../component/behaviorAgentComponent.ts";
import { createAttackGameEvent } from "../../entity/event/attackGameEventData.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import { resolveAttackProfile } from "../../combat/resolveAttackProfile.ts";
import type { AttackTarget } from "../../combat/attackTarget.ts";
import { resolveTargetPoint } from "../../combat/resolveTarget.ts";
import { isWithinReach } from "../../combat/attackReach.ts";
import { hasLineOfSight } from "../../combat/lineOfSight.ts";
import { resolveTargets } from "../../combat/resolveTarget.ts";
import {
    AttackTargetKind,
    type AttackProfileDefinition,
} from "../../../data/combat/attackProfileDefinition.ts";

export type AttackTargetActionData = {
    type: "attackTarget";
    target: AttackTarget;
};

/**
 * Hit whatever the attacker is aimed at, with whatever it is holding
 *
 * Reach and sight are re-checked every tick, because both change under a
 * running attack. When either fails there is no miss and no firing into a wall,
 * the attack simply does not happen
 *
 * The hit lands in the tick it is ordered. At one tick per second an arrow
 * crossing five tiles would otherwise take five seconds to arrive
 */
export function executeAttackTargetAction(
    action: AttackTargetActionData,
    entity: Entity,
    tick: number,
): ActionResult {
    const root = entity.getRootEntity();
    const profile = resolveAttackProfile(entity);

    if (!profile.targets.includes(action.target.kind)) {
        // A planner bug, not a situation, so it is loud
        log.warn(
            `${entity.id} cannot attack a ${action.target.kind} with ${profile.id}`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const impact = resolveTargetPoint(root, action.target);
    if (!impact) {
        // Only an entity target can stop resolving, a tile stays put
        if (action.target.kind === AttackTargetKind.Entity) {
            return {
                kind: "failed",
                cause: { type: "targetGone", entityId: action.target.id },
            };
        }
        return { kind: "failed", cause: { type: "nothingToAttack" } };
    }

    if (!isWithinReach(profile, entity.worldPosition, impact)) {
        log.debug(`${entity.id} target out of reach for ${profile.id}`);
        return { kind: "failed", cause: { type: "outOfReach" } };
    }

    if (!hasLineOfSight(root, entity.worldPosition, impact)) {
        log.debug(`${entity.id} has no line of sight to its target`);
        return { kind: "failed", cause: { type: "noLineOfSight" } };
    }

    // The aim resolved, so nothing went missing. What is here cannot be hurt
    const victims = resolveTargets(root, action.target, impact);
    if (victims.length === 0) {
        return { kind: "failed", cause: { type: "nothingToAttack" } };
    }

    // Before the damage, so a killing blow still shows
    entity.bubbleEvent(createAttackGameEvent(entity, impact));

    for (const victim of victims) {
        landHit(entity, victim, profile, tick, root);
    }

    // A tile is hit once. An entity target holds the action open until it is down
    if (action.target.kind === AttackTargetKind.Tile) {
        return ActionComplete;
    }

    const [victim] = victims;
    const health = victim.getEcsComponent(HealthComponentId);
    if (health && health.currentHp > 0) {
        return ActionRunning;
    }

    return ActionComplete;
}

/** Threat first, then damage. Threat is the profile's number, not the damage */
function landHit(
    attacker: Entity,
    victim: Entity,
    profile: AttackProfileDefinition,
    tick: number,
    root: Entity,
): void {
    let amount = profile.damage;
    if (victim.hasComponent(BuildingComponentId)) {
        amount = profile.structureDamage;
    }

    const threatmap = victim.getEcsComponent(ThreatMapComponentId);
    if (threatmap) {
        const topBefore = getTopThreat(threatmap, tick, root);
        addThreat(threatmap, attacker.id, profile.threat, tick, root);
        const topAfter = getTopThreat(threatmap, tick, root);
        if (topBefore !== topAfter) {
            requestReplan(victim);
        }
    }

    damageEntity(victim, amount, tick);
}

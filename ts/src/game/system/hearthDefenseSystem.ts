import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import type { Entity } from "../entity/entity.ts";
import { computeHearthlight, isInHearthlight } from "../light/hearthlight.ts";
import { collectHostileEntities } from "../component/hostility.ts";
import {
    RoleComponentId,
    WorkerStance,
} from "../component/worker/roleComponent.ts";
import { PlayerUnitComponentId } from "../component/playerUnitComponent.ts";
import {
    getTopThreat,
    refreshIntrusionThreat,
    ThreatMapComponentId,
} from "../component/threatMapComponent.ts";
import { requestReplan } from "../component/BehaviorAgentComponent.ts";

/**
 * How often the defense scan runs, in ticks. See the coupling invariant beside
 * INTRUSION_THREAT in threatMapComponent: the intrusion amount must outlast
 * this interval or defense flickers off between scans. The searchlight sweep
 * dwell is also tuned against this (see SEARCHLIGHT_SWEEP_TICKS).
 */
export const HEARTH_DEFENSE_INTERVAL = 5;

/**
 * Watches the kingdom's hearthlight for intruders and rallies aggressive
 * workers against them. This is the authoritative, server-side hearthlight
 * derivation. Anything the client derives is presentational only.
 *
 * The stance filter sits here and only here. A defensive worker never receives
 * an intrusion entry but still retaliates at full priority when personally
 * hit, because damage threat is written by attackTargetAction regardless of
 * stance. That split falls out of where the filter sits, so no second filter
 * belongs downstream.
 *
 * Response is hearthlight-wide: the player bounds the mob by choosing who is
 * aggressive. Flat INTRUSION_THREAT plus the insertion-order tie-break means
 * all responders focus-fire the first-registered intruder, and when it dies
 * the next resolvable intruder takes over the same tick (dead entries are
 * skipped by getTopThreat). Acceptable v1. Per-distance amounts are a later
 * tuning option.
 *
 * The searchlight makes this a tripwire: a wedge sweeping over a goblin puts
 * that tile in hearthlight for a few ticks, so a passer-by produces a short
 * search-and-give-up via threat decay, while a genuine approach reaches the
 * static pools before the entry dies and the chase sustains. A worker the
 * wedge sweeps over is likewise momentarily inside hearthlight and eligible
 * as a defender that tick. The light found them.
 */
export const hearthDefenseSystem: EcsSystem = {
    onUpdate: update,
};

function update(root: Entity, tick: number) {
    if (tick % HEARTH_DEFENSE_INTERVAL !== 0) {
        return;
    }

    const hearthlight = computeHearthlight(root);
    if (hearthlight.size === 0) {
        return;
    }

    const intruders = collectHostileEntities(root).filter((entity) =>
        isInHearthlight(hearthlight, entity.worldPosition),
    );
    if (intruders.length === 0) {
        return;
    }

    for (const [defender, role] of root.queryComponents(RoleComponentId)) {
        if (role.stance !== WorkerStance.Aggressive) {
            continue;
        }
        if (!defender.hasComponent(PlayerUnitComponentId)) {
            continue;
        }
        // The defender's own workerGlow claims nothing, so a worker standing
        // alone in the dark is not "inside hearthlight" by their own light.
        if (!isInHearthlight(hearthlight, defender.worldPosition)) {
            continue;
        }
        const threat = defender.getEcsComponent(ThreatMapComponentId);
        if (!threat) {
            continue;
        }
        const topBefore = getTopThreat(threat, tick, root);
        for (const intruder of intruders) {
            refreshIntrusionThreat(threat, intruder.id, tick, root);
        }
        const topAfter = getTopThreat(threat, tick, root);
        if (topBefore !== topAfter) {
            requestReplan(defender);
        }
    }
}

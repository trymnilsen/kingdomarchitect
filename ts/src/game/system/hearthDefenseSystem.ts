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
 * workers against them. This is the authoritative hearthlight derivation;
 * anything the client derives is presentational.
 *
 * The stance filter lives here. A defensive worker gets no intrusion entry but
 * still retaliates at full priority when hit, because attackTargetAction writes
 * damage threat regardless of stance.
 *
 * Response is hearthlight-wide, and the player bounds the mob by choosing who
 * is aggressive. A flat INTRUSION_THREAT with an insertion-order tie-break has
 * every responder focus the first-registered intruder, and the next one takes
 * over the same tick it dies.
 *
 * A sweeping searchlight wedge puts a tile in hearthlight for a few ticks,
 * which turns it into a tripwire: a passer-by draws a short search that threat
 * decay ends, while a real approach reaches the static pools before the entry
 * dies and the chase holds.
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

import type { Entity } from "../entity/entity.ts";

export type ThreatSource = "damage" | "intrusion";

export type ThreatEntry = {
    amount: number;
    time: number;
    source: ThreatSource;
};

export type ThreatMapComponent = {
    id: typeof ThreatMapComponentId;
    threat: { [entityId: string]: ThreatEntry };
};

/**
 * The threat a sighted intruder carries, and the floor every new entry gets.
 *
 * Coupling invariant: INTRUSION_THREAT must stay greater than
 * HEARTH_DEFENSE_INTERVAL x THREAT_DECAY_PER_TICK (currently 10 > 5, twice the
 * headroom). Violate it and intrusion entries expire between refresh scans, so
 * defense flickers off while the goblin stands in the light. Whoever retunes
 * any of the three meets this comment.
 */
export const INTRUSION_THREAT = 10;

/**
 * Threat decays linearly, derived at read time rather than ticked. A worker
 * pursues about INTRUSION_THREAT / THREAT_DECAY_PER_TICK ticks after refreshes
 * stop, then disengages. Decay applies to damage entries too, so grudges fade
 * after combat instead of lasting forever.
 */
export const THREAT_DECAY_PER_TICK = 1;

export function createThreatMapComponent(): ThreatMapComponent {
    return {
        id: ThreatMapComponentId,
        threat: {},
    };
}

/**
 * The threat an entry exerts at `tick`, after decay. Derived rather than
 * stored, so no system has to walk every threat map every tick to age them.
 */
export function effectiveThreat(entry: ThreatEntry, tick: number): number {
    return entry.amount - (tick - entry.time) * THREAT_DECAY_PER_TICK;
}

/**
 * Records or accumulates threat from an attacker. Repeated hits from the same
 * attacker stack their damage amount raw.
 *
 * A new entry is floored at INTRUSION_THREAT. The invariant is that one hit
 * must sustain pursuit at least as long as one intrusion sighting does,
 * whatever the per-hit damage value happens to be. Without the floor a small
 * hit decays out mid-approach and produces turn-toward, give-up, get-hit-again
 * oscillation.
 *
 * A hit always stamps the entry damage-sourced. An intrusion entry that gets
 * hit becomes a grudge.
 */
export function addThreat(
    component: ThreatMapComponent,
    attackerEntityId: string,
    amount: number,
    tick: number,
    root: Entity,
): void {
    sweepStaleEntries(component, tick, root);
    const existing = component.threat[attackerEntityId];
    if (existing) {
        existing.amount += amount;
        existing.time = tick;
        existing.source = "damage";
    } else {
        component.threat[attackerEntityId] = {
            amount: Math.max(amount, INTRUSION_THREAT),
            time: tick,
            source: "damage",
        };
    }
}

/**
 * Records that an intruder was sighted inside hearthlight. Set-and-refresh,
 * never accumulate: per-tick accumulation would let a loiterer outrank an
 * active attacker. A damage-sourced entry only gets its time bumped. A grudge
 * is never downgraded to an intrusion.
 */
export function refreshIntrusionThreat(
    component: ThreatMapComponent,
    intruderId: string,
    tick: number,
    root: Entity,
): void {
    sweepStaleEntries(component, tick, root);
    const existing = component.threat[intruderId];
    if (existing) {
        if (existing.source === "intrusion") {
            existing.amount = INTRUSION_THREAT;
        }
        existing.time = tick;
    } else {
        component.threat[intruderId] = {
            amount: INTRUSION_THREAT,
            time: tick,
            source: "intrusion",
        };
    }
}

/**
 * Returns the entity id of the most pressing threat, or undefined when nothing
 * qualifies. Entries that have decayed to nothing and entries whose entity no
 * longer resolves are skipped: a dead attacker's large decaying entry must not
 * block engaging the live goblin currently stabbing the worker.
 *
 * Any positive, resolvable damage entry outranks every intrusion entry.
 * Self-defence beats hunting a trespasser. Within a class the highest
 * effective amount wins, and strict `>` means earlier-inserted entries win
 * ties. Callers depend on that for deterministic top-before / top-after
 * comparisons in attackTargetAction.
 *
 * Never mutates. Pruning happens at write time in addThreat and
 * refreshIntrusionThreat.
 */
export function getTopThreat(
    component: ThreatMapComponent,
    tick: number,
    root: Entity,
): string | undefined {
    let topDamageId: string | undefined;
    let topDamageAmount = 0;
    let topIntrusionId: string | undefined;
    let topIntrusionAmount = 0;
    for (const [id, entry] of Object.entries(component.threat)) {
        const effective = effectiveThreat(entry, tick);
        if (effective <= 0) {
            continue;
        }
        if (root.findEntity(id) === null) {
            continue;
        }
        if (entry.source === "damage") {
            if (effective > topDamageAmount) {
                topDamageAmount = effective;
                topDamageId = id;
            }
        } else {
            if (effective > topIntrusionAmount) {
                topIntrusionAmount = effective;
                topIntrusionId = id;
            }
        }
    }
    if (topDamageId !== undefined) {
        return topDamageId;
    }
    return topIntrusionId;
}

/**
 * Deletes decayed-out and unresolvable entries. Runs inside the write paths
 * only, so reads stay pure while the map still cannot grow without bound.
 */
function sweepStaleEntries(
    component: ThreatMapComponent,
    tick: number,
    root: Entity,
): void {
    for (const [id, entry] of Object.entries(component.threat)) {
        if (effectiveThreat(entry, tick) <= 0 || root.findEntity(id) === null) {
            delete component.threat[id];
        }
    }
}

export const ThreatMapComponentId = "threatMap";

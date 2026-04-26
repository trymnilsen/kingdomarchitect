export type ThreatMapComponent = {
    id: typeof ThreatMapComponentId;
    threat: { [entityId: string]: { amount: number; time: number } };
};

export function createThreatMapComponent(): ThreatMapComponent {
    return {
        id: ThreatMapComponentId,
        threat: {},
    };
}

/**
 * Records or accumulates threat from an attacker.
 * Repeated hits from the same attacker stack their damage amount.
 */
export function addThreat(
    component: ThreatMapComponent,
    attackerEntityId: string,
    amount: number,
    tick: number,
): void {
    const existing = component.threat[attackerEntityId];
    if (existing) {
        existing.amount += amount;
        existing.time = tick;
    } else {
        component.threat[attackerEntityId] = { amount, time: tick };
    }
}

/**
 * Returns the entity id with the highest accumulated threat amount, or
 * undefined if the threat map is empty. Strict `>` means earlier-inserted
 * entries win ties — callers depend on that for deterministic top-before /
 * top-after comparisons in attackTargetAction.
 */
export function getTopThreat(
    component: ThreatMapComponent,
): string | undefined {
    let topId: string | undefined;
    let topAmount = 0;
    for (const [id, entry] of Object.entries(component.threat)) {
        if (entry.amount > topAmount) {
            topAmount = entry.amount;
            topId = id;
        }
    }
    return topId;
}

export const ThreatMapComponentId = "threatMap";

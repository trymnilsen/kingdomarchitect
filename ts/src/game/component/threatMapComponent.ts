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

export const ThreatMapComponentId = "threatMap";

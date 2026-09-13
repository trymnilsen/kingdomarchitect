import {
    AttackTargetKind,
    type AttackProfileDefinition,
} from "../../../src/data/combat/attackProfileDefinition.ts";

/**
 * An attack profile with exactly the properties a test cares about, so
 * rebalancing a real weapon cannot break a test that was never about balance
 */
export function testAttackProfile(
    overrides: Partial<AttackProfileDefinition> = {},
): AttackProfileDefinition {
    return {
        id: "testProfile",
        range: 1,
        damage: 1,
        structureDamage: 1,
        threat: 1,
        targets: [AttackTargetKind.Entity],
        ...overrides,
    };
}

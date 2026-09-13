export const AttackTargetKind = {
    Entity: "entity",
    Tile: "tile",
} as const;

export type AttackTargetKind =
    (typeof AttackTargetKind)[keyof typeof AttackTargetKind];

export type AttackProfileDefinition = {
    id: string;
    /** Range 1 is the four cardinal neighbours */
    range: number;
    damage: number;
    structureDamage: number;
    threat: number;
    targets: readonly AttackTargetKind[];
};

const MELEE_STRUCTURE_DAMAGE = 10;

export const unarmedAttackProfile: AttackProfileDefinition = {
    id: "unarmed",
    range: 1,
    damage: 1,
    structureDamage: MELEE_STRUCTURE_DAMAGE,
    threat: 1,
    targets: [AttackTargetKind.Entity],
};

export const woodenSwordAttackProfile: AttackProfileDefinition = {
    id: "woodenSword",
    range: 1,
    damage: 2,
    structureDamage: MELEE_STRUCTURE_DAMAGE,
    threat: 2,
    targets: [AttackTargetKind.Entity],
};

export const swordAttackProfile: AttackProfileDefinition = {
    id: "sword",
    range: 1,
    damage: 4,
    structureDamage: MELEE_STRUCTURE_DAMAGE,
    threat: 4,
    targets: [AttackTargetKind.Entity],
};

export const bowAttackProfile: AttackProfileDefinition = {
    id: "bow",
    range: 5,
    damage: 2,
    structureDamage: 1,
    threat: 1,
    targets: [AttackTargetKind.Entity],
};

const attackProfileDefinitions: readonly AttackProfileDefinition[] = [
    unarmedAttackProfile,
    woodenSwordAttackProfile,
    swordAttackProfile,
    bowAttackProfile,
];

export function getAttackProfileDefinition(
    id: string,
): AttackProfileDefinition | undefined {
    return attackProfileDefinitions.find((definition) => definition.id === id);
}

import type { Entity } from "../entity/entity.ts";

export const KingdomType = {
    Player: 0,
    Npc: 1,
    Goblin: 2,
} as const;

export type KingdomType = (typeof KingdomType)[keyof typeof KingdomType];
export type KingdomComponent = {
    id: typeof KingdomComponentId;
    type: KingdomType;
    /** The game tick at which this kingdom was founded/spawned */
    foundedAtTick: number;
};

export function createKingdomComponent(
    type: KingdomType,
    foundedAtTick: number = 0,
): KingdomComponent {
    return {
        id: KingdomComponentId,
        type,
        foundedAtTick,
    };
}

export function belongsToPlayerKingdom(entity: Entity): boolean {
    const kingdom = entity.getAncestorEcsComponent(KingdomComponentId);
    return kingdom?.type === KingdomType.Player;
}

export const KingdomComponentId = "kingdom";

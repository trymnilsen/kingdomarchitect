export const KingdomType = {
    Player: 0,
    Npc: 1,
    Goblin: 2,
} as const;

export type KingdomType = typeof KingdomType[keyof typeof KingdomType];
export type KingdomComponent = {
    id: typeof KingdomComponentId;
    type: KingdomType;
};

export function createKingdomComponent(type: KingdomType): KingdomComponent {
    return {
        id: KingdomComponentId,
        type,
    };
}

export const KingdomComponentId = "kingdom";

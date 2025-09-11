export enum KingdomType {
    Player,
    Npc,
    Goblin,
}
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

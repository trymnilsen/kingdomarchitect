import type { DesiredInventoryEntry } from "./desiredInventoryComponent.ts";

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
    /** Default desired inventory for newly created workers in this kingdom */
    defaultDesiredInventory: DesiredInventoryEntry[];
};

export function createKingdomComponent(
    type: KingdomType,
    foundedAtTick: number = 0,
    defaultDesiredInventory?: DesiredInventoryEntry[],
): KingdomComponent {
    const defaults: DesiredInventoryEntry[] =
        defaultDesiredInventory ??
        (type === KingdomType.Player
            ? [{ itemId: "bread", amount: 2 }]
            : []);

    return {
        id: KingdomComponentId,
        type,
        foundedAtTick,
        defaultDesiredInventory: defaults,
    };
}

export const KingdomComponentId = "kingdom";

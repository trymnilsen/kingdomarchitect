import type { InventoryItem } from "../inventory/inventoryItem.ts";
import {
    bagOfGlitter,
    gemResource,
    goldCoins,
} from "../inventory/items/resources.ts";

export type LootDrop = {
    item: InventoryItem;
    amount: number;
    /**
     * Probability from 0 to 1 that this drop appears at all. Omitted means it
     * always drops, so the goblin purse stays a reliable reward rather than a
     * lottery.
     */
    chance?: number;
};

/**
 * What a kind of creature leaves behind when it dies. This is the definition of
 * the drop, not the act of dropping: the loot system reads it to spawn piles,
 * and the item-source screen reads it to answer "where does this come from".
 * Both need the same answer, so neither owns the numbers.
 */
export type LootTable = {
    id: string;
    /** How the source reads to the player when listed as a way to get an item. */
    sourceName: string;
    drops: readonly LootDrop[];
};

/**
 * A goblin's purse and whatever shiny thing it was hoarding. Gold has no mine
 * and no recipe, so this is the economy's only tap: coin enters the kingdom by
 * being taken off raiders. Gems come the same way, which puts the enchanter and
 * the library downstream of going out and fighting.
 *
 * These numbers are the lever for how affordable gold-priced buildings and
 * magic feel.
 */
export const goblinLootTable: LootTable = {
    id: "goblin",
    sourceName: "Slain Goblin",
    drops: [
        { item: goldCoins, amount: 1 },
        { item: gemResource, amount: 1, chance: 0.1 },
        { item: bagOfGlitter, amount: 1, chance: 0.05 },
    ],
};

export const lootTables: readonly LootTable[] = [goblinLootTable] as const;

/**
 * Resolve a table into the drops that actually landed this time. Drops with no
 * `chance` always land.
 *
 * The random source is a parameter so tests can pin a roll instead of running
 * the same kill a thousand times and hoping.
 */
export function rollLootDrops(
    table: LootTable,
    random: () => number = Math.random,
): LootDrop[] {
    const landed: LootDrop[] = [];
    for (const drop of table.drops) {
        if (drop.chance === undefined || random() < drop.chance) {
            landed.push(drop);
        }
    }
    return landed;
}

export type LootComponent = {
    id: typeof LootComponentId;
    /** Id of the LootTable rolled when this entity dies. */
    lootTableId: string;
};

export const LootComponentId = "Loot";

/**
 * Marks an entity as something that leaves loot behind. Carrying the table id
 * rather than the table keeps the component pure data, and it is what lets the
 * loot system answer "what did this drop" without knowing whether it killed a
 * goblin or a boar.
 */
export function createLootComponent(lootTableId: string): LootComponent {
    return {
        id: LootComponentId,
        lootTableId,
    };
}

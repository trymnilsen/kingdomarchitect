import type { InventoryItemQuantity } from "../inventory/inventoryItemQuantity.ts";
import { fishItem } from "../inventory/items/resources.ts";

export type FishingProfileDefinition = {
    id: string;
    // Ticks at the water before the catch lands
    duration: number;
    catch: InventoryItemQuantity;
};

// Worse than the fishing hut on purpose, so a settlement that eats fish builds one
export const fishingRodProfile: FishingProfileDefinition = {
    id: "fishingRod",
    duration: 6,
    catch: { item: fishItem, amount: 1 },
};

const fishingProfileDefinitions: readonly FishingProfileDefinition[] = [
    fishingRodProfile,
];

export function getFishingProfileDefinition(
    id: string,
): FishingProfileDefinition | undefined {
    return fishingProfileDefinitions.find((definition) => definition.id === id);
}

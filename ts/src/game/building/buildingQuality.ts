import { ItemRarity } from "../../data/inventory/inventoryItem.ts";
import type { InventoryComponent } from "../component/inventoryComponent.ts";

/**
 * Calculate building quality from the materials used in construction.
 * Quality is determined by the weighted average rarity of all materials,
 * with probabilistic rounding.
 */
export function calculateBuildingQuality(
    buildingInventory: InventoryComponent,
): ItemRarity {
    if (buildingInventory.items.length === 0) {
        return ItemRarity.Common;
    }

    let totalWeight = 0;
    let totalRarityValue = 0;

    for (const stack of buildingInventory.items) {
        const rarity = stack.item.rarity ?? ItemRarity.Common;
        totalRarityValue += rarity * stack.amount;
        totalWeight += stack.amount;
    }

    if (totalWeight === 0) {
        return ItemRarity.Common;
    }

    const averageRarity = totalRarityValue / totalWeight;
    return roundRarityProbabilistically(averageRarity);
}

/**
 * Round a fractional rarity value probabilistically.
 * E.g., 2.7 has 70% chance of Rare (3), 30% chance of Uncommon (2).
 */
function roundRarityProbabilistically(averageRarity: number): ItemRarity {
    const lowerRarity = Math.floor(averageRarity);
    const upperRarity = Math.ceil(averageRarity);

    // Clamp to valid rarity range
    const minRarity = ItemRarity.Common;
    const maxRarity = ItemRarity.Legendary;

    if (lowerRarity >= maxRarity) {
        return maxRarity;
    }
    if (upperRarity <= minRarity) {
        return minRarity;
    }

    // If it's a whole number, return it directly
    if (lowerRarity === upperRarity) {
        return Math.max(minRarity, Math.min(maxRarity, lowerRarity)) as ItemRarity;
    }

    // Probabilistic rounding
    const fractionForUpper = averageRarity - lowerRarity;
    const roll = Math.random();

    if (roll < fractionForUpper) {
        return Math.min(maxRarity, upperRarity) as ItemRarity;
    } else {
        return Math.max(minRarity, lowerRarity) as ItemRarity;
    }
}

/**
 * Get a human-readable name for a rarity level.
 */
export function getRarityName(rarity: ItemRarity): string {
    switch (rarity) {
        case ItemRarity.Common:
            return "Common";
        case ItemRarity.Uncommon:
            return "Uncommon";
        case ItemRarity.Rare:
            return "Rare";
        case ItemRarity.Epic:
            return "Epic";
        case ItemRarity.Legendary:
            return "Legendary";
        default:
            return "Unknown";
    }
}

import type { SpriteRef } from "../../asset/sprite.ts";
import { spriteRefs } from "../../asset/sprite.ts";
import type { InventoryItemIds } from "../inventory/inventoryItems.ts";

/**
 * Identifies a crop a farm can be configured to grow. A string union (not an
 * enum) so it serializes as-is on the farm component and reads plainly in saves.
 */
export type CropId = "wheat" | "flax" | "straw";

/**
 * The static definition of a crop: what it produces and how it grows. This is the
 * "what a crop is" data, kept separate from the farm (which only stores *which*
 * crop via its CropId). The farm derives output item, yield, and growth time from
 * here on read, so balancing changes here apply to every existing farm.
 */
export type CropDefinition = {
    cropId: CropId;
    name: string;
    subtitle: string;
    description: string;
    icon: SpriteRef;
    /** Inventory item id produced when this crop is harvested. */
    itemId: InventoryItemIds;
    /** Items yielded per harvest. */
    yieldAmount: number;
    /** Ticks from planted to Ready. */
    growthDuration: number;
};

export const cropDefinitions: CropDefinition[] = [
    {
        cropId: "wheat",
        name: "Wheat",
        subtitle: "Food & Bread",
        description:
            "The staple grain of any settlement. Wheat feeds the realm directly and is milled and baked into bread - the simplest way to keep workers on their feet.",
        icon: spriteRefs.farm_4,
        itemId: "wheat",
        yieldAmount: 4,
        growthDuration: 60,
    },
    {
        cropId: "flax",
        name: "Flax",
        subtitle: "Fiber & Cloth",
        description:
            "A fibrous crop grown not for the table but for the loom. Flax stalks are retted and spun into thread, the first step toward cloth, sacks, and sails.",
        icon: spriteRefs.farm_4,
        itemId: "flax",
        yieldAmount: 3,
        growthDuration: 80,
    },
    {
        cropId: "straw",
        name: "Straw",
        subtitle: "Fuel & Thatch",
        description:
            "Dry stalks gathered for burning and bundling. Straw makes cheap fuel for torches and thatch for roofs - humble, but it keeps the lights lit.",
        icon: spriteRefs.farm_4,
        itemId: "straw",
        yieldAmount: 4,
        growthDuration: 50,
    },
];

/**
 * Look up a crop's properties by id. Falls back to the first crop on an unknown
 * id so callers (growth, harvest, windmill) never have to null-check a malformed
 * save before producing a sensible result.
 */
export function getCropDefinition(cropId: CropId): CropDefinition {
    return (
        cropDefinitions.find((def) => def.cropId === cropId) ??
        cropDefinitions[0]
    );
}

/**
 * Crops the player may currently choose for a farm. Today every crop is
 * available; this is the single seam where progression/unlock gating will later
 * filter the list (it will take a settlement/tech context argument). Keeping it
 * distinct from `cropDefinitions` means the selection UI never needs reworking
 * when gating arrives.
 */
export function getAvailableCrops(): CropDefinition[] {
    return cropDefinitions;
}

import { type SpriteRef, emptySpriteRef } from "../../asset/sprite.ts";
import type { InventoryItemIds } from "../inventory/inventoryItems.ts";

export const SpecialRequirement = {
    DevoteeConsecration: "devotee_consecration",
    DevoteeLabor: "devotee_labor",
    SkilledCarving: "skilled_carving",
    MagicalFocusItem: "magical_focus_item",
} as const;

export type SpecialRequirement =
    (typeof SpecialRequirement)[keyof typeof SpecialRequirement];

export const specialRequirementNames: Record<SpecialRequirement, string> = {
    [SpecialRequirement.DevoteeConsecration]: "Devotee Consecration",
    [SpecialRequirement.DevoteeLabor]: "Devotee Labor",
    [SpecialRequirement.SkilledCarving]: "Skilled Carving",
    [SpecialRequirement.MagicalFocusItem]: "Magical Focus Item",
};

export type BuildingRequirements = {
    materials?: { [key in InventoryItemIds]?: number };
    special?: readonly SpecialRequirement[];
};

export type Building = {
    icon: SpriteRef;
    name: string;
    id: string;
    scale: 1 | 2 | 4;
    /**
     * Overrides the auto-computed preview scale in the building selection UI.
     * When not set, the preview scales the sprite to ~160px height for the pop-up book effect.
     */
    previewScale?: number;
    /**
     * Pixels of transparent gap to add below the sprite artwork in the preview panel.
     * Lifts the sprite upward so it doesn't press against the bottom border of the preview box,
     * matching the visual breathing room that buildings with transparent bottom pixels get naturally.
     */
    previewOffset?: number;
    requirements?: BuildingRequirements;
};

export const nullBuildingId = "nullBuilding";
export const nullBuilding: Building = {
    icon: emptySpriteRef,
    name: nullBuildingId,
    id: nullBuildingId,
    scale: 1,
};

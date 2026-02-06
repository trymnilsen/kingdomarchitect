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
    requirements?: BuildingRequirements;
};

export const nullBuildingId = "nullBuilding";
export const nullBuilding: Building = {
    icon: emptySpriteRef,
    name: nullBuildingId,
    id: nullBuildingId,
    scale: 1,
};

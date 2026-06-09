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
    /**
     * Which light source profile this building emits, as a
     * {@link LightSourceDefinition} id, or `"none"` to emit nothing (ruins,
     * foundations). When omitted the building uses the default faint self-glow.
     * A building that is itself a placed light source (e.g. a brazier) points
     * this at its own profile so it flows through the same emission path.
     */
    light?: string;
    requirements?: BuildingRequirements;
    /**
     * How attractive this building is as a goblin raid objective. Higher values
     * are razed first. Goblin raiders rank player buildings by this when forming
     * a raid (see formGoblinRaid). Omitted → a base value (DEFAULT_RAID_VALUE) is
     * used. Set to 0 for things that should never be a raid *objective* (walls,
     * gates, roads); those are still broken through as obstacles by the siege
     * path when they block the route, just never chosen as a target.
     */
    raidValue?: number;
};

export const nullBuildingId = "nullBuilding";
export const nullBuilding: Building = {
    icon: emptySpriteRef,
    name: nullBuildingId,
    id: nullBuildingId,
    scale: 1,
};

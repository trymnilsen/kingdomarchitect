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
     * Which light source profile this building emits
     */
    light?: string;
    requirements?: BuildingRequirements;
    /**
     * How many items this building can hold when it acts as settlement storage.
     * A building becomes storage by declaring this: the prefab attaches the
     * stockpile components to anything that does. Absent means it is not a
     * storage site.
     */
    storageCapacity?: number;
    /**
     * Path cost of walking over this building. Present means walkable, and the
     * number is what pathfinding pays to cross it (a road is cheap, a farm is
     * trampled through reluctantly). Absent means solid, which is the default
     * for anything with walls.
     *
     * Weights at or above TRAVERSAL_IMPASSABLE_THRESHOLD read as solid, which is
     * how a gate closes without needing a separate passability rule.
     */
    traversalWeight?: number;
    /**
     * Marks this building as a gate: something the settlement can open and
     * shut, which is passable while open and a wall while closed. Declaring it
     * here rather than matching an id in the prefab keeps "what this building
     * is" in the building definition.
     */
    isGate?: boolean;
    /**
     * What this building is worth to a goblin, which drives two things at once.
     * Raiders rank player buildings by it when forming a raid (see
     * formGoblinRaid), razing the highest first. kingdomScore sums it across
     * the settlement to decide how often camps raid at all. Omitted → a base
     * value (DEFAULT_RAID_VALUE) is used.
     *
     * Set to 0 for things that are neither loot nor an objective (walls, gates,
     * roads). Those add nothing to the score, so fortifying does not raise the
     * threat level, and they are still broken through as obstacles by the siege
     * path when they block the route. Changing this number therefore retunes
     * raid pacing as well as targeting. Do not treat it as cosmetic.
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

import type {
    EquipmentSpriteVariant,
    PartBoundsEquipment,
    PartColors,
} from "../../rendering/character/characterColors.ts";

/**
 * Everything an item changes about how its holder looks. Any mix of fields is
 * allowed, so a bow can put a hat on its archer without being drawn itself,
 * and a sword can be drawn in the hand and dress its wielder in a shirt.
 */
export type ItemVisual = {
    /** Drawn at the hand of whichever slot holds the item. */
    readonly held?: EquipmentSpriteVariant;
    /** Attached to body parts, such as a hat on the head or boots on each foot. */
    readonly worn?: readonly PartBoundsEquipment[];
    readonly partColors?: PartColors;
};

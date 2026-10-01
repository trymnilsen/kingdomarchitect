import { spriteRefs } from "../../asset/sprite.ts";
import {
    EquipmentSpriteVariantType,
    type PartBoundsEquipment,
} from "../../rendering/character/characterColors.ts";

/**
 * A hat the character builder can put on directly. The game reaches the same
 * `worn` values through the `visual` of the items that grant them, so both
 * draw the hat at the same spot.
 */
export type HatAppearance = {
    id: string;
    name: string;
    worn: PartBoundsEquipment;
};

export const wizardHatWorn: PartBoundsEquipment = {
    attachToPart: "Head",
    sprite: {
        type: EquipmentSpriteVariantType.Single,
        sprite: spriteRefs.wizard_hat,
        offset: { x: 6, y: 10 },
    },
};

export const archerHatWorn: PartBoundsEquipment = {
    attachToPart: "Head",
    sprite: {
        type: EquipmentSpriteVariantType.Mirrored,
        sprite: spriteRefs.archer_hat,
        offset: { x: 6, y: 10 },
    },
};

export const hatAppearances: readonly HatAppearance[] = [
    { id: "wizardHat", name: "Wizard Hat", worn: wizardHatWorn },
    { id: "archerHat", name: "Archer Hat", worn: archerHatWorn },
];

import { spriteRefs, type SpriteRef } from "../asset/sprite.ts";
import type { Point } from "../common/point.ts";
import { ItemCategory } from "../data/inventory/inventoryItem.ts";
import type { EquipmentComponent } from "../game/component/equipmentComponent.ts";
import type { Facing } from "./characterAnimation.ts";
import { wizardHat } from "../data/inventory/items/equipment.ts";

export type EquipmentSpriteVariant =
    | { type: "single"; sprite: SpriteRef }
    | { type: "mirrored"; east: SpriteRef }
    | { type: "perFacing"; sprites: Partial<Record<Facing, SpriteRef>>; fallback: SpriteRef };

type AnchorEquipment = {
    anchor: string;
    offsetInSpriteForAnchorPoint: Point;
    sprite: EquipmentSpriteVariant;
};

type PartBoundsEquipment = {
    attachToPart: string;
    offset: Point;
    sprite: EquipmentSpriteVariant;
    z?: 0 | 1;
};

export type CharacterColors = {
    Chest?: string;
    Pants?: string;
    Feet?: string;
    Hands?: string;
    Equipment?: Array<AnchorEquipment | PartBoundsEquipment>;
};

export function getCharacterColors(
    equipmentComponent: EquipmentComponent,
): CharacterColors {
    const mainHand = equipmentComponent.slots.main;
    let chestColor = "#FACBA6";
    if (mainHand?.category == ItemCategory.Melee) {
        chestColor = "#424242";
    }

    const equipment: Array<AnchorEquipment | PartBoundsEquipment> = [];
    for (const slot of [equipmentComponent.slots.main, equipmentComponent.slots.other]) {
        if (slot?.id === wizardHat.id) {
            equipment.push({
                attachToPart: "Head",
                offset: { x: 6, y: 10 },
                sprite: { type: "single", sprite: spriteRefs.wizard_hat },
            });
        }
    }

    return {
        Chest: chestColor,
        ...(equipment.length > 0 ? { Equipment: equipment } : {}),
    };
}

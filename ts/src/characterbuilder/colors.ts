import type { Sprite2 } from "../asset/sprite.ts";
import type { Point } from "../common/point.ts";
import { ItemCategory } from "../data/inventory/inventoryItem.ts";
import type { EquipmentComponent } from "../game/component/equipmentComponent.ts";

export type CharacterColors = {
    Chest?: string;
    Pants?: string;
    Feet?: string;
    Hands?: string;
    Equipment?: {
        // The sprite to attach
        sprite: Sprite2;
        // An offset in the sprite to align it with the given anchor position
        offsetInSpriteForAnchorPoint: Point;
        // The id of the anchor we want to anchor to
        anchor: string;
    }[];
};

export function getCharacterColors(
    equipmentComponent: EquipmentComponent,
): CharacterColors {
    const mainHand = equipmentComponent.slots.main;
    let chestColor = "#FACBA6";
    if (mainHand?.category == ItemCategory.Melee) {
        chestColor = "#424242";
    }
    return {
        Chest: chestColor,
    };
}

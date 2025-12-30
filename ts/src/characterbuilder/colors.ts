import { ItemCategory } from "../data/inventory/inventoryItem.ts";
import type { EquipmentComponent } from "../game/component/equipmentComponent.ts";

export type CharacterColors = {
    Chest?: string;
    Pants?: string;
    Feet?: string;
    Hands?: string;
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

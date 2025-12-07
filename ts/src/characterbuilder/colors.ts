import type { EquipmentComponent } from "../game/component/equipmentComponent.js";

export type CharacterColors = {
    Chest?: string;
    Pants?: string;
    Feet?: string;
    Hands?: string;
};

export function getCharacterColors(
    equipmentComponent: EquipmentComponent,
): CharacterColors {
    throw new Error("TODO");
}

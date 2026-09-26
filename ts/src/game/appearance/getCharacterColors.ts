import { ItemCategory } from "../../data/inventory/inventoryItem.ts";
import { wizardHat } from "../../data/inventory/items/equipment.ts";
import { spriteRefs } from "../../asset/sprite.ts";
import {
    EquipmentSpriteVariantType,
    type AnchorEquipment,
    type CharacterColors,
    type PartBoundsEquipment,
} from "../../rendering/character/characterColors.ts";
import type { EquipmentComponent } from "../component/equipmentComponent.ts";

/** Held items follow the slot, not the item, so a torch can be in either hand. */
const slotAnchors = [
    { anchor: "RightHand", slot: "primary" },
    { anchor: "LeftHand", slot: "secondary" },
] as const;

/**
 * Lives in the game layer because its rules are about items and slots, not
 * drawing. A new held item is a data change: give the item a `visual`.
 */
export function getCharacterColors(
    equipmentComponent: EquipmentComponent,
): CharacterColors {
    const primaryHand = equipmentComponent.slots.primary;
    let chestColor = "#FACBA6";
    if (primaryHand?.category == ItemCategory.Melee) {
        chestColor = "#424242";
    }

    const equipment: Array<AnchorEquipment | PartBoundsEquipment> = [];
    for (const { anchor, slot } of slotAnchors) {
        const item = equipmentComponent.slots[slot];
        if (!item) {
            continue;
        }
        // The hat is worn rather than held, so it attaches to the head from
        // whichever slot it happens to occupy.
        if (item.id === wizardHat.id) {
            equipment.push({
                attachToPart: "Head",
                sprite: {
                    type: EquipmentSpriteVariantType.Single,
                    sprite: spriteRefs.wizard_hat,
                    offset: { x: 6, y: 10 },
                },
            });
            continue;
        }
        if (item.visual) {
            equipment.push({ anchor, sprite: item.visual });
        }
    }

    return {
        Chest: chestColor,
        ...(equipment.length > 0 ? { Equipment: equipment } : {}),
    };
}

import { ItemCategory } from "../../data/inventory/inventoryItem.ts";
import { wizardHat } from "../../data/inventory/items/equipment.ts";
import { spriteRefs } from "../../asset/sprite.ts";
import type {
    AnchorEquipment,
    CharacterColors,
    PartBoundsEquipment,
} from "../../rendering/character/characterColors.ts";
import type { EquipmentComponent } from "../component/equipmentComponent.ts";

/**
 * Which hand each equipment slot is drawn in. Held items follow the slot rather
 * than the item, so the same torch renders in either hand depending on where it
 * was equipped.
 */
const slotAnchors = [
    { anchor: "RightHand", slot: "primary" },
    { anchor: "LeftHand", slot: "secondary" },
] as const;

/**
 * What a character looks like given what they are carrying. This is the game's
 * appearance policy: it reads equipment (game state) and produces the sprite
 * generator's {@link CharacterColors} contract.
 *
 * It lives in the game layer rather than beside the generator because the rules
 * here are about items and slots, not about drawing. Adding a held item is a
 * data change (give the item a `visual`), and changing which hand a slot maps
 * to is a change here, neither of which should require touching rendering code
 * or the character builder devtool.
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
                offset: { x: 6, y: 10 },
                sprite: { type: "single", sprite: spriteRefs.wizard_hat },
            });
            continue;
        }
        // An item's own `visual` says what it looks like in a hand, so a new
        // held item is data rather than another branch here.
        if (item.visual) {
            equipment.push({
                anchor,
                offsetInSpriteForAnchorPoint: item.visual.offset,
                sprite: { type: "single", sprite: item.visual.sprite },
            });
        }
    }

    return {
        Chest: chestColor,
        ...(equipment.length > 0 ? { Equipment: equipment } : {}),
    };
}

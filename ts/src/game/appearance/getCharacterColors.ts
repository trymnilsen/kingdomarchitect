import type {
    AnchorEquipment,
    CharacterColors,
    PartBoundsEquipment,
    PartColors,
} from "../../rendering/character/characterColors.ts";
import type { EquipmentComponent } from "../component/equipmentComponent.ts";

/**
 * Held items follow the slot, not the item, so a torch can be in either hand.
 * Primary comes first because the weapon hand wins when both slots dress the
 * same body part or color.
 */
const slotAnchors = [
    { anchor: "RightHand", slot: "primary" },
    { anchor: "LeftHand", slot: "secondary" },
] as const;

/**
 * Lives in the game layer because its rules are about items and slots, not
 * drawing. A new look for an item is a data change: give the item a `visual`.
 */
export function getCharacterColors(
    slots: EquipmentComponent["slots"],
): CharacterColors {
    let partColors: PartColors = {};
    const held: AnchorEquipment[] = [];
    const wornByPart = new Map<string, PartBoundsEquipment>();

    for (const { anchor, slot } of slotAnchors) {
        const visual = slots[slot]?.visual;
        if (!visual) {
            continue;
        }
        if (visual.held) {
            held.push({ anchor, sprite: visual.held });
        }
        for (const worn of visual.worn ?? []) {
            if (!wornByPart.has(worn.attachToPart)) {
                wornByPart.set(worn.attachToPart, worn);
            }
        }
        // Colors from earlier slots are spread last so they win.
        partColors = { ...visual.partColors, ...partColors };
    }

    const colors: CharacterColors = { ...partColors };
    const equipment = [...held, ...wornByPart.values()];
    if (equipment.length > 0) {
        colors.Equipment = equipment;
    }
    return colors;
}

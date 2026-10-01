import { hatAppearances } from "../../../data/appearance/hatAppearance.ts";
import type { InventoryItem } from "../../../data/inventory/inventoryItem.ts";
import { getCharacterColors } from "../../../game/appearance/getCharacterColors.ts";
import type { EquipmentSlot } from "../../../game/component/equipmentComponent.ts";
import type {
    CharacterColors,
    PartColors,
} from "../../../rendering/character/characterColors.ts";
import { ITEMS_WITH_VISUAL } from "./itemsWithVisual.ts";

/**
 * What the user has picked, kept as ids so the panels can tell which option is
 * active. The colors to draw are derived from it with `toCharacterColors`.
 */
export type CharacterBuilderSelection = {
    slots: Record<EquipmentSlot, string | null>;
    /** Only parts the user has colored. A cleared part is removed, not set to undefined. */
    partColors: PartColors;
    /** null leaves the hat to whatever the equipped items put on the head. */
    hatId: string | null;
};

export function createEmptySelection(): CharacterBuilderSelection {
    return {
        slots: { primary: null, secondary: null },
        partColors: {},
        hatId: null,
    };
}

/**
 * Equipped items go through the game's own `getCharacterColors`, so the
 * preview shows what the game would draw. The user's color and hat picks then
 * replace what the items gave.
 */
export function toCharacterColors(
    selection: CharacterBuilderSelection,
): CharacterColors {
    const colors: CharacterColors = {
        ...getCharacterColors({
            primary: findItem(selection.slots.primary),
            secondary: findItem(selection.slots.secondary),
        }),
        ...selection.partColors,
    };

    const hat = hatAppearances.find((h) => h.id === selection.hatId);
    if (hat) {
        const otherEquipment = (colors.Equipment ?? []).filter(
            (e) =>
                !("attachToPart" in e) ||
                e.attachToPart !== hat.worn.attachToPart,
        );
        colors.Equipment = [...otherEquipment, hat.worn];
    }

    return colors;
}

function findItem(itemId: string | null): InventoryItem | null {
    return ITEMS_WITH_VISUAL.find((item) => item.id === itemId) ?? null;
}

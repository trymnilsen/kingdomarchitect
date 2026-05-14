import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import { uiScaffold } from "../../view/uiScaffold.ts";
import { EquipUnitSelectionState } from "./equipUnitSelectionState.ts";

/**
 * Step between "I picked an item to equip" and "I'll tap the unit to equip it
 * on": the player chooses which slot the item goes into. Pushed by the
 * stockpile inventory equip button. The ground-pile selection panel exposes
 * the same Primary/Secondary choices inline because it can fit them in the
 * actor submenu — this state exists for the inventory-view path which only
 * has room for a single button.
 */
export class EquipSlotSelectionState extends InteractionState {
    private readonly sourceEntityId: string;
    private readonly itemId: string;

    constructor(sourceEntityId: string, itemId: string) {
        super();
        this.sourceEntityId = sourceEntityId;
        this.itemId = itemId;
    }

    override get stateName(): string {
        return "Choose slot";
    }

    override get isModal(): boolean {
        return true;
    }

    override getView(): ComponentDescriptor | null {
        return uiScaffold({
            leftButtons: [
                {
                    text: "Primary",
                    onClick: () => this.pickSlot("primary"),
                },
                {
                    text: "Secondary",
                    onClick: () => this.pickSlot("secondary"),
                },
                {
                    text: "Cancel",
                    onClick: () => this.context.stateChanger.pop(null),
                },
            ],
        });
    }

    private pickSlot(slot: "primary" | "secondary"): void {
        this.context.stateChanger.replace(
            new EquipUnitSelectionState(this.sourceEntityId, this.itemId, slot),
        );
    }
}

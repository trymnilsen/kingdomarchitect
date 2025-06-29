import { Sprite2, sprites2 } from "../../../../../module/asset/sprite.js";
import { allSides, symmetricSides } from "../../../../../common/sides.js";
import {
    InventoryItem,
    ItemTag,
} from "../../../../../data/inventory/inventoryItem.js";
import { InventoryItemList } from "../../../../../data/inventory/inventoryItemQuantity.js";
import { UIThemeType, bookInkColor } from "../../../../../module/ui/color.js";
import { ComponentDescriptor } from "../../../../../module/ui/declarative/ui.js";
import { Entity } from "../../../../entity/entity.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { StateContext } from "../../../handler/stateContext.js";
import { UIActionbarItem } from "../../../view/actionbar/uiActionbar.js";
import { UIActionbarScaffold } from "../../../view/actionbar/uiActionbarScaffold.js";
import { AlertMessageState } from "../../common/alertMessageState.js";
import { inventoryView } from "./inventoryView.js";
import type { InventoryComponent } from "../../../../component/inventoryComponent.js";

export class InventoryState extends InteractionState {
    private _selectedItemIndex = 0;

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Inventory";
    }

    override getView(): ComponentDescriptor | null {
        return inventoryView({
            inventory: this.forInventory,
            selectedItemIndex: this._selectedItemIndex,
            onItemSelected: (index: number) => {
                this._selectedItemIndex = index;
            },
            onEquip: (item: InventoryItem) => {
                this.onEquip(item);
            },
            onDrop: (_item: InventoryItem) => {
                this.context.stateChanger.push(
                    new AlertMessageState("Ops", "not implemented"),
                );
            },
            onCancel: () => {
                this.context.stateChanger.pop(null);
            },
        });
    }

    //TODO: Add parameters for filtering and button providers for selected item
    constructor(private forInventory: InventoryComponent) {
        super();
    }

    override onActive(): void {
        // No imperative UI setup needed anymore
    }

    private onEquip(_item: InventoryItem) {
        //TODO: Reimplement onEquip with new equipment component
        /*
        const equipmentComponent =
            this.forInventory.entity.getComponent(EquipmentComponent);

        if (!equipmentComponent) {
            this.context.stateChanger.push(
                new AlertMessageState("Uh oh", "Not available"),
            );
            return;
        }

        const removeResult = this.forInventory.removeInventoryItem(item.id, 1);
        if (removeResult) {
            equipmentComponent.mainItem.setItem(item);
            this.context.stateChanger.pop();
        }*/
    }
}

export function getAssetImage(index: number): Sprite2 | null {
    switch (index) {
        case 0:
            return sprites2.wood_resource;
        case 1:
            return sprites2.bag_of_glitter;
        case 2:
            return sprites2.gem_resource;
        case 3:
            return sprites2.stone_resource;
        default:
            return null;
    }
}

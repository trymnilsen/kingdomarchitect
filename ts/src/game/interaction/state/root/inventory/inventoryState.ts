import { InventoryItem } from "../../../../../data/inventory/inventoryItem.js";
import { Sprite2, sprites2 } from "../../../../../asset/sprite.js";
import { ComponentDescriptor } from "../../../../../ui/declarative/ui.js";
import {
    InventoryComponentId,
    type InventoryComponent,
} from "../../../../component/inventoryComponent.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { AlertMessageState } from "../../common/alertMessageState.js";
import { inventoryView } from "./inventoryView.js";
import type { Entity } from "../../../../entity/entity.js";
import type { InventoryItemQuantity } from "../../../../../data/inventory/inventoryItemQuantity.js";
import { EquipItemCommand } from "../../../../../server/message/command/equipItemCommand.js";

export class InventoryState extends InteractionState {
    private _selectedItemIndex = 0;
    private _inventoryComponent: InventoryComponent;
    private _entity: Entity;

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Inventory";
    }

    override getView(): ComponentDescriptor | null {
        return inventoryView({
            inventory: this._inventoryComponent,
            selectedItemIndex: this._selectedItemIndex,
            onItemSelected: (index: number) => {
                this._selectedItemIndex = index;
            },
            onEquip: (item: InventoryItemQuantity) => {
                this.onEquip(item);
            },
            onDrop: (_item: InventoryItemQuantity) => {
                this.context.stateChanger.push(
                    new AlertMessageState("Ops", "not implemented"),
                );
            },
            onCancel: () => {
                this.context.stateChanger.pop(null);
            },
        });
    }

    constructor(entity: Entity) {
        super();
        const inventory = entity.getEcsComponent(InventoryComponentId);
        if (!inventory) {
            throw new Error(
                "InventoryState requires a inventory component on provided entity",
            );
        }

        this._entity = entity;
        this._inventoryComponent = inventory;
    }

    override onActive(): void {
        // No imperative UI setup needed anymore
    }

    private onEquip(item: InventoryItemQuantity) {
        this.context.commandDispatcher(
            EquipItemCommand(item.item, this._entity, "main"),
        );
        this.context.stateChanger.pop();
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

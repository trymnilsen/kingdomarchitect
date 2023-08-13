import { InventoryItem } from "../../../data/inventory/inventoryItem.js";
import { EntityComponent } from "../entityComponent.js";

export class ChestComponent extends EntityComponent {
    constructor(public items: InventoryItem[]) {
        super();
    }
}

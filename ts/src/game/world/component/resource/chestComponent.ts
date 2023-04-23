import { InventoryItem } from "../../../../data/inventory/inventoryItem";
import { EntityComponent } from "../entityComponent";

export class ChestComponent extends EntityComponent {
    constructor(public items: InventoryItem[]) {
        super();
    }
}

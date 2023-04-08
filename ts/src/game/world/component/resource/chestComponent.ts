import { InventoryItem } from "../../../../data/inventory/inventoryItem";
import { EntityComponent } from "../entityComponent";

export class ChestComponent extends EntityComponent {
    constructor(private initialItems: InventoryItem[]) {
        super();
    }
}

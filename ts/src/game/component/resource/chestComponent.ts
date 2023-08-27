import { InventoryItem } from "../../../data/inventory/inventoryItem.js";
import { EntityComponent } from "../entityComponent.js";

type ChestBundle = {
    items: InventoryItem[];
};

export class ChestComponent extends EntityComponent<ChestBundle> {
    public items: InventoryItem[] = [];

    static createInstance(items: InventoryItem[]): ChestComponent {
        const instance = new ChestComponent();
        instance.fromComponentBundle({
            items: items,
        });
        return instance;
    }

    override fromComponentBundle(bundle: ChestBundle): void {
        this.items = bundle.items;
    }
    override toComponentBundle(): ChestBundle {
        return {
            items: this.items,
        };
    }
}

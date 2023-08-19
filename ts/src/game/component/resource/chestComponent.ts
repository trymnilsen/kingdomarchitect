import { InventoryItem } from "../../../data/inventory/inventoryItem.js";
import { EntityComponent } from "../entityComponent.js";

type ChestBundle = {
    items: InventoryItem[];
};

export class ChestComponent extends EntityComponent<ChestBundle> {
    public items: InventoryItem[] = [];

    static createInstance(items: InventoryItem[]): ChestComponent {
        const instance = new ChestComponent();
        instance.fromBundle({
            items: items,
        });
        return instance;
    }

    override fromBundle(bundle: ChestBundle): void {
        this.items = bundle.items;
    }
    override toBundle(): ChestBundle {
        return {
            items: this.items,
        };
    }
}

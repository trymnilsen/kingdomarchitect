import { CraftingOutputTag } from "../../../data/inventory/inventoryItemQuantity.js";
import { stoneResource } from "../../../data/inventory/items/resources.js";
import { EntityComponent } from "../entityComponent.js";
import { InventoryComponent2 } from "../inventory/inventoryComponent.js";
import { BuildingComponent } from "./buildingComponent.js";

export class QuaryComponent extends EntityComponent {
    private previousSpawnTime: number = 0;
    override onStart(tick: number): void {
        this.previousSpawnTime = tick;
    }

    override onUpdate(tick: number): void {
        if (tick - this.previousSpawnTime > 30) {
            this.previousSpawnTime = tick;
            const building = this.entity.getComponent(BuildingComponent);
            const inventory = this.entity.getComponent(InventoryComponent2);
            if (inventory && building?.isScaffolded == false) {
                const alreadyHasStone =
                    inventory.amountOf(stoneResource.id) > 0;

                if (!alreadyHasStone) {
                    inventory.addInventoryItem(
                        stoneResource,
                        1,
                        CraftingOutputTag,
                    );
                }
            }
        }
    }
}

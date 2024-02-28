import { InventoryComponent } from "../../../inventory/inventoryComponent.js";
import { MovementComponent } from "../../../movement/movementComponent.js";
import { ChestComponent } from "../../../resource/chestComponent.js";
import { Job } from "../../job.js";

export class CollectChestJob extends Job {
    constructor(private chest: ChestComponent) {
        super();
    }

    override update(): void {
        if (!this.chest) {
            throw new Error("No chest component provided");
        }

        if (this.adjacentTo(this.chest.entity.worldPosition)) {
            const inventory = this.chest.entity
                .getRootEntity()
                .requireComponent(InventoryComponent);

            for (const item of this.chest.items) {
                inventory.addInventoryItem(item, 1);
            }

            this.chest.entity.remove();
            this.complete();
        } else {
            //Path towards the chest until we are adjacent to it
            const movementComponent =
                this.entity.requireComponent(MovementComponent);

            movementComponent.pathTo(this.chest.entity.worldPosition);
        }
    }
}

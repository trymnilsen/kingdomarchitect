import { InventoryItem } from "../../../../data/inventory/inventoryItem.js";
import { InventoryComponent2 } from "../../inventory/inventoryComponent.js";
import { MovementComponent } from "../../movement/movementComponent.js";
import { HasInventoryItemJobConstraint } from "../constraint/hasInventoryItemJobConstraint.js";
import { IsWorkerJobConstraint } from "../constraint/isWorkerJobConstraint.js";
import { Job } from "../job.js";

export class CollectJob extends Job {
    constructor(
        private item: InventoryItem,
        private fromInventory: InventoryComponent2,
    ) {
        super([new IsWorkerJobConstraint()]);
    }

    override update(_tick: number): void {
        if (this.adjacentTo(this.fromInventory.entity.worldPosition)) {
            const inventory = this.entity.requireComponent(InventoryComponent2);

            const amountToRemove = this.fromInventory.amountOf(this.item.id);
            const removeResult = this.fromInventory.removeInventoryItem(
                this.item.id,
                amountToRemove,
            );
            inventory.addInventoryItem(this.item, amountToRemove);

            this.complete();
        } else {
            //Path towards the chest until we are adjacent to it
            const movementComponent =
                this.entity.requireComponent(MovementComponent);

            movementComponent.pathTo(this.fromInventory.entity.worldPosition);
        }
    }
}

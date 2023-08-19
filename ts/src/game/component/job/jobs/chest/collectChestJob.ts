import { InventoryComponent } from "../../../inventory/inventoryComponent.js";
import { ChestComponent } from "../../../resource/chestComponent.js";
import { WorkerConstraint } from "../../constraint/workerConstraint.js";
import { Job } from "../../job.js";
import { MoveToBeforeJob } from "../moveToBeforeJob.js";

export class CollectChestJob extends MoveToBeforeJob {
    constructor(chest: ChestComponent) {
        super(new _CollectChestJob(chest), new WorkerConstraint());
    }
}

class _CollectChestJob extends Job {
    constructor(private readonly chest: ChestComponent) {
        super();
    }

    get tileX(): number {
        return this.chest.entity.worldPosition.x;
    }

    get tileY(): number {
        return this.chest.entity.worldPosition.y;
    }

    override update(tick: number): void {
        const inventory =
            this.chest.entity.getAncestorComponent(InventoryComponent);

        if (inventory) {
            for (const item of this.chest.items) {
                inventory.addInventoryItem(item, 1);
            }
        }
        this.chest.entity.remove();
        this.complete();
    }
}

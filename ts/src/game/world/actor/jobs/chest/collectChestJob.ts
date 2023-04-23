import { InventoryComponent } from "../../../component/inventory/inventoryComponent";
import { ChestComponent } from "../../../component/resource/chestComponent";
import { WorkerConstraint } from "../../job/constraint/workerConstraint";
import { Job } from "../../job/job";
import { MoveToBeforeJob } from "../moveToBeforeJob";

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

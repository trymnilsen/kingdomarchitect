function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { InventoryComponent } from "../../../component/inventory/inventoryComponent.js";
import { WorkerConstraint } from "../../constraint/workerConstraint.js";
import { Job } from "../../job.js";
import { MoveToBeforeJob } from "../moveToBeforeJob.js";
export class CollectChestJob extends MoveToBeforeJob {
    constructor(chest){
        super(new _CollectChestJob(chest), new WorkerConstraint());
    }
}
class _CollectChestJob extends Job {
    get tileX() {
        return this.chest.entity.worldPosition.x;
    }
    get tileY() {
        return this.chest.entity.worldPosition.y;
    }
    update(tick) {
        const inventory = this.chest.entity.getAncestorComponent(InventoryComponent);
        if (inventory) {
            for (const item of this.chest.items){
                inventory.addInventoryItem(item, 1);
            }
        }
        this.chest.entity.remove();
        this.complete();
    }
    constructor(chest){
        super();
        _define_property(this, "chest", void 0);
        this.chest = chest;
    }
}

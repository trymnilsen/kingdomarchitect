import { generateId } from "../../../../src/common/idGenerator.js";
import { InventoryItemQuantity } from "../../../../src/data/inventory/inventoryItemQuantity.js";
import { InventoryComponent2 } from "../../../../src/game/component/inventory/inventoryComponent.js";
import { JobQueue } from "../../../../src/game/component/job/jobQueue.js";
import { JobQueueComponent } from "../../../../src/game/component/job/jobQueueComponent.js";
import { workerPrefab } from "../../../../src/game/prefab/workerPrefab.js";
import { EntityTestProxy } from "../../world/entityTestProxy.js";
import { WorldTestHelper } from "../../world/worldTestHelper.js";

export class JobTestHelper {
    private _world: WorldTestHelper;
    public get queue(): JobQueue {
        return this._world.rootEntity.requireComponent(JobQueueComponent);
    }

    public get world(): WorldTestHelper {
        return this._world;
    }

    constructor() {
        this._world = new WorldTestHelper();
    }

    workerWithInventory(items: InventoryItemQuantity[]): EntityTestProxy {
        const worker = workerPrefab(generateId("worker"));
        const inventory = worker.requireComponent(InventoryComponent2);
        for (const item of items) {
            inventory.addInventoryItem(item.item, item.amount);
        }

        const proxy = new EntityTestProxy(worker);
        this.world.rootEntity.addChild(worker);
        return proxy;
    }
}

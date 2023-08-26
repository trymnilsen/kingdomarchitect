import { InventoryComponent } from "../../../inventory/inventoryComponent.js";
import { ChestComponent } from "../../../resource/chestComponent.js";
import { Job } from "../../job.js";

type CollectChestBundle = {
    entityId: string;
};

export class CollectChestJob extends Job<CollectChestBundle> {
    private chest: ChestComponent | null = null;

    static createInstance(chestComponent: ChestComponent): CollectChestJob {
        const instance = new CollectChestJob();
        instance.bundle = {
            entityId: chestComponent.entity.id,
        };
        return instance;
    }

    override update(tick: number): void {
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
            this.movement.pathTowards(this.chest.entity.worldPosition);
        }
    }

    protected override onPersistJobState(): CollectChestBundle {
        if (!this.chest) {
            return {} as CollectChestBundle;
        } else {
            return {
                entityId: this.chest?.entity.id,
            };
        }
    }

    protected override onFromPersistedState(bundle: CollectChestBundle): void {
        const entityWithId = this.entity
            .getRootEntity()
            .findEntity(bundle.entityId);

        if (!entityWithId) {
            throw new Error(`No entity with id ${entityWithId} found`);
        }

        const chestComponent = entityWithId.requireComponent(ChestComponent);
        this.chest = chestComponent;
    }
}

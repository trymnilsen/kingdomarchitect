import { sortBy } from "../../../../common/array.js";
import { distanceSquared } from "../../../../common/point.js";
import { InventoryItemQuantity } from "../../../../data/inventory/inventoryItemQuantity.js";
import { woodResourceItem } from "../../../../data/inventory/items/resources.js";
import { Entity } from "../../../entity/entity.js";
import { BuildingComponent } from "../../building/buildingComponent.js";
import { assertEntityComponent } from "../../entityComponent.js";
import { HealthComponent } from "../../health/healthComponent.js";
import { InventoryComponent2 } from "../../inventory/inventoryComponent.js";
import { MovementComponent } from "../../movement/movementComponent.js";
import { HasInventoryItemJobConstraint } from "../constraint/hasInventoryItemJobConstraint.js";
import { IsWorkerJobConstraint } from "../constraint/isWorkerJobConstraint.js";
import { Job } from "../job.js";
import { JobRunnerComponent } from "../jobRunnerComponent.js";
const buildResources = {
    item: woodResourceItem,
    amount: 20,
};

export class BuildJob extends Job {
    constructor(private buildingComponent: BuildingComponent) {
        super([
            new HasInventoryItemJobConstraint(buildResources),
            new IsWorkerJobConstraint(),
        ]);
    }

    update(): void {
        const remainingItemsNeededToBuild =
            this.buildingComponent.remainingItems;

        if (remainingItemsNeededToBuild.length > 0) {
            this.gatherItem(remainingItemsNeededToBuild[0]);
        } else {
            if (this.adjacentTo(this.buildingComponent.entity.worldPosition)) {
                const healthComponent =
                    this.buildingComponent.entity.requireComponent(
                        HealthComponent,
                    );

                if (healthComponent.healthPercentage < 1) {
                    healthComponent.heal(10);
                }

                if (healthComponent.healthPercentage >= 1) {
                    this.buildingComponent.finishBuild();
                    this.complete();
                }
            } else {
                const movementComponent =
                    this.entity.requireComponent(MovementComponent);

                movementComponent.pathTo(
                    this.buildingComponent.entity.worldPosition,
                );
            }
        }
    }

    private gatherItem(neededItem: InventoryItemQuantity) {
        const inventory = this.entity.requireComponent(InventoryComponent2);
        const amount = inventory.amountOf(neededItem.item.id);
        if (amount > 0) {
            if (this.adjacentTo(this.buildingComponent.entity.worldPosition)) {
                const amountToDeliver = Math.min(neededItem.amount, amount);
                const couldRemove = inventory.removeInventoryItem(
                    buildResources.item.id,
                    amountToDeliver,
                );

                if (couldRemove) {
                    this.buildingComponent.supplyBuildingMaterial([
                        { item: neededItem.item, amount: amountToDeliver },
                    ]);
                }
            } else {
                const movementComponent =
                    this.entity.requireComponent(MovementComponent);

                movementComponent.pathTo(
                    this.buildingComponent.entity.worldPosition,
                );
            }
        } else {
            //Find the closest stockpile
            const stockpile = this.findClosestStockpile();
            if (stockpile == null) {
                this.returnToQueue();
                return;
            }
            //Move towards stockpile
            if (this.adjacentTo(stockpile.entity.worldPosition)) {
                const amountToTake = Math.min(
                    buildResources.amount,
                    stockpile.amountOf(buildResources.item.id),
                );
                const hadAmount = stockpile.removeInventoryItem(
                    buildResources.item.id,
                    amountToTake,
                );
                if (hadAmount) {
                    inventory.addInventoryItem(
                        buildResources.item,
                        amountToTake,
                    );
                }
            } else {
                const movementComponent =
                    this.entity.requireComponent(MovementComponent);

                const moveResult = movementComponent.pathTo(
                    stockpile.entity.worldPosition,
                );
                const foo = 5 + 5;
            }
        }
    }

    private findClosestStockpile(): InventoryComponent2 | null {
        const inventories = this.entity
            .getRootEntity()
            .queryComponentsOld(InventoryComponent2)
            .filter((component) => {
                // TODO: Improve the check for if the entity with inventory is a stockpile
                const doesNotHaveAJobRunner =
                    component.entity.getComponent(JobRunnerComponent) == null;

                return doesNotHaveAJobRunner;
            });

        const closest = sortBy(inventories, (item) => {
            return distanceSquared(
                item.entity.worldPosition,
                this.entity.worldPosition,
            );
        });

        if (closest.length > 0) {
            return closest[0];
        } else {
            return null;
        }
    }
}

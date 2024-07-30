import * as assert from "node:assert";
import { BuildJob } from "../../../../../src/game/component/job/jobs/buildJob.js";
import { InventoryComponent2 } from "../../../../../src/game/component/inventory/inventoryComponent.js";
import { JobTestHelper } from "../jobTestHelper.js";
import { InventoryItemQuantity } from "../../../../../src/data/inventory/inventoryItemQuantity.js";
import { woodResourceItem } from "../../../../../src/data/inventory/items/resources.js";
import { buildingPrefab } from "../../../../../src/game/prefab/buildingPrefab.js";
import { generateId } from "../../../../../src/common/idGenerator.js";
import { foodBuildings } from "../../../../../src/data/building/food/food.js";
import { BuildingComponent } from "../../../../../src/game/component/building/buildingComponent.js";
import { TwoRunnersAndStockpileTestScaffold } from "../../../world/scaffold/twoRunnersAndStockpileTestScaffold.js";
import { JobQueueComponent } from "../../../../../src/game/component/job/jobQueueComponent.js";
import { JobState } from "../../../../../src/game/component/job/jobState.js";

describe("BuildJob", () => {
    it("Scheduling job will look for runners with a full inventory", () => {
        const scaffold = new TwoRunnersAndStockpileTestScaffold();
        scaffold.secondWorker.entity
            .requireComponent(InventoryComponent2)
            .addInventoryItem(woodResourceItem, 20);

        const buildingComponent =
            scaffold.unfinishedBuilding.entity.requireComponent(
                BuildingComponent,
            );

        const buildJob = new BuildJob(buildingComponent);

        scaffold.rootEntity
            .requireComponent(JobQueueComponent)
            .addJob(buildJob);

        assert.equal(
            buildJob.jobState,
            JobState.Running,
            "Job was not in correct state",
        );
        assert.equal(
            buildJob.entity,
            scaffold.secondWorker.entity,
            "Job was not assigned to correct runner",
        );
    });

    it("Will visit stockpile if there is not enough in inventory", () => {
        const scaffold = new TwoRunnersAndStockpileTestScaffold();
        scaffold.stockpile.entity
            .requireComponent(InventoryComponent2)
            .addInventoryItem(woodResourceItem, 20);

        const buildingComponent =
            scaffold.unfinishedBuilding.entity.requireComponent(
                BuildingComponent,
            );

        const buildJob = new BuildJob(buildingComponent);

        scaffold.rootEntity
            .requireComponent(JobQueueComponent)
            .addJob(buildJob);

        scaffold.runUpdates(100);

        const amountAfter = scaffold.stockpile.entity
            .requireComponent(InventoryComponent2)
            .amountOf(woodResourceItem.id);

        const wasAdjacent = scaffold.firstWorker.movement.wasAdjacentTo(
            scaffold.stockpile.entity.worldPosition,
        );

        assert.equal(wasAdjacent, true);
        assert.equal(amountAfter, 0);
    });

    it("Will return job to queue if there is no available resources", () => {
        assert.equal(2, 2);
    });

    it("Will move to building site if not adjacent to", () => {
        assert.equal(2, 2);
    });

    it("Will increment build amount if adjacent and building has resource", () => {
        assert.equal(2, 2);
    });

    it("Will transfer own resources if needed resources is not full", () => {
        assert.equal(2, 2);
    });
});

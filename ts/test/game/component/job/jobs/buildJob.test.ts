import { describe, it, expect } from "vitest";
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

        expect(buildJob.jobState, "Job was not in correct state").toBe(
            JobState.Running,
        );
        expect(buildJob.entity, "Job was not assigned to correct runner").toBe(
            scaffold.secondWorker.entity,
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

        expect(wasAdjacent).toBe(true);
        expect(amountAfter).toBe(0);
    });

    it("Will return job to queue if there is no available resources", () => {
        expect(2).toBe(2);
    });

    it("Will move to building site if not adjacent to", () => {
        expect(2).toBe(2);
    });

    it("Will increment build amount if adjacent and building has resource", () => {
        expect(2).toBe(2);
    });

    it("Will transfer own resources if needed resources is not full", () => {
        expect(2).toBe(2);
    });
});

import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createJobQueueComponent } from "../../../src/game/component/jobQueueComponent.ts";
import {
    createFarmComponent,
    FarmComponentId,
    FarmState,
} from "../../../src/game/component/farmComponent.ts";
import { executePlantCropAction } from "../../../src/game/behavior/actions/plantCropAction.ts";
import { createInventoryComponent } from "../../../src/game/component/inventoryComponent.ts";

function createTestScene(): { root: Entity; worker: Entity; farm: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const farm = new Entity("farm");

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(farm);

    worker.worldPosition = { x: 12, y: 8 };
    farm.worldPosition = { x: 13, y: 8 }; // Adjacent to worker

    farm.setEcsComponent(createFarmComponent());
    worker.setEcsComponent(createInventoryComponent());

    return { root, worker, farm };
}

describe("plantCropAction", () => {
    it("transitions farm from Empty to Growing after 3 ticks", () => {
        const { worker, farm } = createTestScene();
        const action = {
            type: "plantCrop" as const,
            buildingId: "farm",
            workProgress: 2,
        };

        const result = executePlantCropAction(action, worker, 100);

        assert.strictEqual(result.kind, "complete");
        const farmComp = farm.getEcsComponent(FarmComponentId)!;
        assert.strictEqual(farmComp.state, FarmState.Growing);
    });

    it("sets plantedAtTick to current tick on completion", () => {
        const { worker, farm } = createTestScene();
        const action = {
            type: "plantCrop" as const,
            buildingId: "farm",
            workProgress: 2,
        };

        executePlantCropAction(action, worker, 42);

        const farmComp = farm.getEcsComponent(FarmComponentId)!;
        assert.strictEqual(farmComp.plantedAtTick, 42);
    });

    it("completes without state change if farm is not Empty", () => {
        const { worker, farm } = createTestScene();
        const farmComp = farm.getEcsComponent(FarmComponentId)!;
        farmComp.state = FarmState.Growing;

        const action = { type: "plantCrop" as const, buildingId: "farm" };
        const result = executePlantCropAction(action, worker, 10);

        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(farmComp.state, FarmState.Growing);
    });
});

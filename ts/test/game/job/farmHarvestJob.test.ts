import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createJobQueueComponent } from "../../../src/game/component/jobQueueComponent.ts";
import {
    createFarmComponent,
    FarmComponentId,
    FarmState,
} from "../../../src/game/component/farmComponent.ts";
import {
    getCropDefinition,
    type CropId,
} from "../../../src/data/crop/cropDefinitions.ts";
import { executeHarvestCropAction } from "../../../src/game/behavior/actions/harvestCropAction.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
    isHeldEmpty,
} from "../../../src/game/component/heldItemComponent.ts";

function createTestScene(cropId: CropId = "wheat"): {
    root: Entity;
    worker: Entity;
    farm: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const farm = new Entity("farm");

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(farm);

    worker.worldPosition = { x: 12, y: 8 };
    farm.worldPosition = { x: 13, y: 8 }; // Adjacent to worker

    const farmComp = createFarmComponent(cropId);
    farmComp.state = FarmState.Ready;
    farm.setEcsComponent(farmComp);

    worker.setEcsComponent(createHeldItemComponent());

    return { root, worker, farm };
}

describe("harvestCropAction", () => {
    it("yields the configured crop's item and amount, not a hardcoded wheat", () => {
        // Proves the harvest derives output from the farm's cropId via the crop
        // registry rather than a value baked onto the component at creation.
        const { worker } = createTestScene("flax");
        const flax = getCropDefinition("flax");
        const action = { type: "harvestCrop" as const, buildingId: "farm" };

        const result = executeHarvestCropAction(action, worker);

        assert.strictEqual(result.kind, "complete");
        const held = worker.getEcsComponent(HeldItemComponentId)!;
        assert.strictEqual(held.item?.id, flax.itemId);
        assert.strictEqual(held.amount, flax.yieldAmount);
    });

    it("completes without state change when farm is not Ready (race condition)", () => {
        const { worker, farm } = createTestScene();
        const farmComp = farm.getEcsComponent(FarmComponentId)!;
        farmComp.state = FarmState.Growing;

        const action = { type: "harvestCrop" as const, buildingId: "farm" };
        const result = executeHarvestCropAction(action, worker);

        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(farmComp.state, FarmState.Growing);

        const held = worker.getEcsComponent(HeldItemComponentId)!;
        assert.ok(
            isHeldEmpty(held),
            "held should remain empty when farm is not Ready",
        );
    });
});

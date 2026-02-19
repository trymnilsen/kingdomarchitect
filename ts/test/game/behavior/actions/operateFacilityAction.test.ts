import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createInventoryComponent,
    getInventoryItem,
    InventoryComponentId,
} from "../../../../src/game/component/inventoryComponent.ts";
import {
    createProductionComponent,
    ProductionComponentId,
} from "../../../../src/game/component/productionComponent.ts";
import { executeOperateFacilityAction } from "../../../../src/game/behavior/actions/operateFacilityAction.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/Action.ts";

type OperateFacilityAction = Extract<BehaviorActionData, { type: "operateFacility" }>;

function createTestScene(): {
    root: Entity;
    worker: Entity;
    building: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const building = new Entity("building");

    worker.worldPosition = { x: 10, y: 8 };
    building.worldPosition = { x: 11, y: 8 }; // Adjacent

    worker.setEcsComponent(createInventoryComponent());
    building.setEcsComponent(createProductionComponent("quarry_production"));

    root.addChild(worker);
    root.addChild(building);

    return { root, worker, building };
}

describe("operateFacilityAction", () => {
    it("tracks progress on action object", () => {
        const { worker } = createTestScene();

        const action: OperateFacilityAction = {
            type: "operateFacility",
            buildingId: "building",
        };

        const result = executeOperateFacilityAction(action, worker);

        assert.strictEqual(result.kind, "running");
        assert.strictEqual(action.progress, 1);
    });

    it("increments progress each tick", () => {
        const { worker } = createTestScene();

        const action = {
            type: "operateFacility" as const,
            buildingId: "building",
            progress: 5,
        };

        executeOperateFacilityAction(action, worker);

        assert.strictEqual(action.progress, 6);
    });

    it("completes and yields item when progress reaches duration", () => {
        const { worker } = createTestScene();

        // quarry_production has duration: 10
        const action = {
            type: "operateFacility" as const,
            buildingId: "building",
            progress: 9,
        };

        const result = executeOperateFacilityAction(action, worker);

        assert.strictEqual(result.kind, "complete");

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        const stone = getInventoryItem(workerInventory, "stone");
        assert.ok(stone);
        assert.strictEqual(stone.amount, 10);
    });

    it("fails if building entity not found", () => {
        const { worker } = createTestScene();

        const action = {
            type: "operateFacility" as const,
            buildingId: "nonexistent",
        };

        const result = executeOperateFacilityAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("fails if worker not adjacent to building", () => {
        const { worker, building } = createTestScene();
        building.worldPosition = { x: 25, y: 25 }; // Not adjacent

        const action = {
            type: "operateFacility" as const,
            buildingId: "building",
        };

        const result = executeOperateFacilityAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("fails if building has no ProductionComponent", () => {
        const { root, worker } = createTestScene();
        const noProduction = new Entity("noProduction");
        noProduction.worldPosition = { x: 11, y: 8 };
        root.addChild(noProduction);

        const action = {
            type: "operateFacility" as const,
            buildingId: "noProduction",
        };

        const result = executeOperateFacilityAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("fails if production definition not found", () => {
        const { root, worker } = createTestScene();
        const unknownProduction = new Entity("unknownProduction");
        unknownProduction.worldPosition = { x: 11, y: 8 };
        unknownProduction.setEcsComponent(
            createProductionComponent("unknown_production"),
        );
        root.addChild(unknownProduction);

        const action = {
            type: "operateFacility" as const,
            buildingId: "unknownProduction",
        };

        const result = executeOperateFacilityAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });
});

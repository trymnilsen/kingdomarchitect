import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../../src/game/component/healthComponent.ts";
import {
    createBuildingComponent,
    BuildingComponentId,
} from "../../../../src/game/component/buildingComponent.ts";
import { createInventoryComponent } from "../../../../src/game/component/inventoryComponent.ts";
import { SpriteComponentId, createSpriteComponent } from "../../../../src/game/component/spriteComponent.ts";
import { executeConstructBuildingAction } from "../../../../src/game/behavior/actions/constructBuildingAction.ts";
import { woodenHouse } from "../../../../src/data/building/wood/house.ts";
import { InvalidationTracker } from "../behaviorTestHelpers.ts";
import { spriteRefs } from "../../../../src/asset/sprite.ts";

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

    building.setEcsComponent(createBuildingComponent(woodenHouse, true));
    building.setEcsComponent(createHealthComponent(10, 100));
    building.setEcsComponent(createInventoryComponent());

    root.addChild(worker);
    root.addChild(building);

    return { root, worker, building };
}

describe("constructBuildingAction", () => {
    it("heals building by 10 hp per tick", () => {
        const { worker, building } = createTestScene();

        const action = {
            type: "constructBuilding" as const,
            entityId: "building",
        };

        const result = executeConstructBuildingAction(action, worker);

        assert.strictEqual(result, "running");

        const healthComponent = building.getEcsComponent(HealthComponentId)!;
        assert.strictEqual(healthComponent.currentHp, 20);
    });

    it("completes when building reaches max hp", () => {
        const { worker, building } = createTestScene();

        const healthComponent = building.getEcsComponent(HealthComponentId)!;
        healthComponent.currentHp = 95;

        const action = {
            type: "constructBuilding" as const,
            entityId: "building",
        };

        const result = executeConstructBuildingAction(action, worker);

        assert.strictEqual(result, "complete");
        assert.strictEqual(healthComponent.currentHp, 100);
    });

    it("sets scaffolded to false on completion", () => {
        const { worker, building } = createTestScene();

        const healthComponent = building.getEcsComponent(HealthComponentId)!;
        healthComponent.currentHp = 95;

        const action = {
            type: "constructBuilding" as const,
            entityId: "building",
        };

        executeConstructBuildingAction(action, worker);

        const buildingComponent =
            building.getEcsComponent(BuildingComponentId)!;
        assert.strictEqual(buildingComponent.scaffolded, false);
    });

    it("fails if building entity not found", () => {
        const { worker } = createTestScene();

        const action = {
            type: "constructBuilding" as const,
            entityId: "nonexistent",
        };

        const result = executeConstructBuildingAction(action, worker);

        assert.strictEqual(result, "failed");
    });

    it("fails if worker not adjacent to building", () => {
        const { worker, building } = createTestScene();
        building.worldPosition = { x: 25, y: 25 }; // Not adjacent

        const action = {
            type: "constructBuilding" as const,
            entityId: "building",
        };

        const result = executeConstructBuildingAction(action, worker);

        assert.strictEqual(result, "failed");
    });

    it("throws if building has no BuildingComponent", () => {
        const { root, worker } = createTestScene();
        const noBuildingComp = new Entity("noBuildingComp");
        noBuildingComp.worldPosition = { x: 11, y: 8 };
        noBuildingComp.setEcsComponent(createHealthComponent(10, 100));
        root.addChild(noBuildingComp);

        const action = {
            type: "constructBuilding" as const,
            entityId: "noBuildingComp",
        };

        assert.throws(() => {
            executeConstructBuildingAction(action, worker);
        });
    });

    it("throws if building has no HealthComponent", () => {
        const { root, worker } = createTestScene();
        const noHealthComp = new Entity("noHealthComp");
        noHealthComp.worldPosition = { x: 11, y: 8 };
        noHealthComp.setEcsComponent(
            createBuildingComponent(woodenHouse, true),
        );
        root.addChild(noHealthComp);

        const action = {
            type: "constructBuilding" as const,
            entityId: "noHealthComp",
        };

        assert.throws(() => {
            executeConstructBuildingAction(action, worker);
        });
    });

    describe("component invalidation", () => {
        it("invalidates HealthComponent when healing", () => {
            const { root, worker } = createTestScene();
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const action = {
                type: "constructBuilding" as const,
                entityId: "building",
            };

            executeConstructBuildingAction(action, worker);

            assert.strictEqual(
                tracker.wasInvalidated("building", HealthComponentId),
                true,
                "HealthComponent should be invalidated when healing",
            );
        });

        it("invalidates BuildingComponent when construction completes", () => {
            const { root, worker, building } = createTestScene();
            building.setEcsComponent(createSpriteComponent(spriteRefs.wooden_house_scaffold));
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const healthComponent = building.getEcsComponent(HealthComponentId)!;
            healthComponent.currentHp = 95;

            const action = {
                type: "constructBuilding" as const,
                entityId: "building",
            };

            executeConstructBuildingAction(action, worker);

            assert.strictEqual(
                tracker.wasInvalidated("building", BuildingComponentId),
                true,
                "BuildingComponent should be invalidated when construction completes",
            );
        });

        it("invalidates SpriteComponent when construction completes", () => {
            const { root, worker, building } = createTestScene();
            building.setEcsComponent(createSpriteComponent(spriteRefs.wooden_house_scaffold));
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const healthComponent = building.getEcsComponent(HealthComponentId)!;
            healthComponent.currentHp = 95;

            const action = {
                type: "constructBuilding" as const,
                entityId: "building",
            };

            executeConstructBuildingAction(action, worker);

            assert.strictEqual(
                tracker.wasInvalidated("building", SpriteComponentId),
                true,
                "SpriteComponent should be invalidated when construction completes",
            );
        });
    });
});

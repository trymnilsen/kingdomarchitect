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
import { createSpriteComponent } from "../../../../src/game/component/spriteComponent.ts";
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

    describe("component invalidation", () => {
        it("invalidates BuildingComponent when construction completes", () => {
            const { root, worker, building } = createTestScene();
            building.setEcsComponent(
                createSpriteComponent(spriteRefs.wooden_house_scaffold),
            );
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const healthComponent =
                building.getEcsComponent(HealthComponentId)!;
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
    });
});

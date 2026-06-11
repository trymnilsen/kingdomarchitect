import assert from "node:assert";
import { describe, it } from "node:test";
import { EcsWorld } from "../../../../src/common/ecs/ecsWorld.ts";
import { chunkMapSystem } from "../../../../src/game/system/chunkMapSystem.ts";
import { createChunkMapComponent } from "../../../../src/game/component/chunkMapComponent.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { createSpriteComponent } from "../../../../src/game/component/spriteComponent.ts";
import {
    createFarmComponent,
    FarmComponentId,
    FarmState,
} from "../../../../src/game/component/farmComponent.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
import { executeWorkWindmillAction } from "../../../../src/game/behavior/actions/workWindmillAction.ts";
import { wheatResourceItem } from "../../../../src/data/inventory/items/resources.ts";
import type { CropId } from "../../../../src/data/crop/cropDefinitions.ts";
import type { Point } from "../../../../src/common/point.ts";
import type { SpriteRef } from "../../../../src/asset/sprite.ts";

const testSprite: SpriteRef = { bin: "test", spriteId: "test" };

function createWorld(): Entity {
    const ecsWorld = new EcsWorld();
    ecsWorld.addSystem(chunkMapSystem);
    ecsWorld.root.setEcsComponent(createChunkMapComponent());
    return ecsWorld.root;
}

function addWindmill(root: Entity, position: Point): Entity {
    const entity = new Entity("windmill");
    entity.setEcsComponent(createSpriteComponent(testSprite));
    root.addChild(entity);
    entity.worldPosition = position;
    return entity;
}

function addFarm(
    root: Entity,
    id: string,
    position: Point,
    cropId: CropId,
    plantedAtTick: number,
): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(testSprite));
    const farm = createFarmComponent(cropId);
    farm.state = FarmState.Ready;
    farm.plantedAtTick = plantedAtTick;
    entity.setEcsComponent(farm);
    root.addChild(entity);
    entity.worldPosition = position;
    return entity;
}

function addWorker(root: Entity, position: Point): Entity {
    const entity = new Entity("worker");
    entity.setEcsComponent(createSpriteComponent(testSprite));
    entity.setEcsComponent(createHeldItemComponent());
    root.addChild(entity);
    entity.worldPosition = position;
    return entity;
}

describe("workWindmillAction", () => {
    it("harvests the longest-waiting ready crop, not the first in scan order", () => {
        const root = createWorld();
        addWindmill(root, { x: 10, y: 10 });
        // Wheat sits at the top tile, scanned before the straw tiles. It was
        // replanted recently; the straw farms have waited far longer.
        const wheatFarm = addFarm(root, "wheatFarm", { x: 10, y: 9 }, "wheat", 200);
        const strawFarm1 = addFarm(root, "strawFarm1", { x: 9, y: 10 }, "straw", 100);
        const strawFarm2 = addFarm(root, "strawFarm2", { x: 10, y: 11 }, "straw", 110);
        const worker = addWorker(root, { x: 10, y: 10 });

        const result = executeWorkWindmillAction(
            { type: "workWindmill", windmillId: "windmill" },
            worker,
            300,
        );

        assert.strictEqual(result.kind, "complete");
        const held = worker.requireEcsComponent(HeldItemComponentId);
        assert.strictEqual(
            held.item?.id,
            "straw",
            "held should lock to the oldest ready crop",
        );
        assert.strictEqual(held.amount, 8, "both straw farms should be harvested");
        assert.strictEqual(
            strawFarm1.requireEcsComponent(FarmComponentId).state,
            FarmState.Empty,
        );
        assert.strictEqual(
            strawFarm2.requireEcsComponent(FarmComponentId).state,
            FarmState.Empty,
        );
        assert.strictEqual(
            wheatFarm.requireEcsComponent(FarmComponentId).state,
            FarmState.Ready,
            "mismatched wheat should stay ready for a later pass",
        );
    });

    it("only harvests farms matching an already-held crop", () => {
        const root = createWorld();
        addWindmill(root, { x: 10, y: 10 });
        const wheatFarm = addFarm(root, "wheatFarm", { x: 10, y: 9 }, "wheat", 200);
        const strawFarm = addFarm(root, "strawFarm", { x: 9, y: 10 }, "straw", 100);
        const worker = addWorker(root, { x: 10, y: 10 });
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = wheatResourceItem;
        held.amount = 2;

        const result = executeWorkWindmillAction(
            { type: "workWindmill", windmillId: "windmill" },
            worker,
            300,
        );

        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(held.item?.id, "wheat");
        assert.strictEqual(held.amount, 6, "wheat yield added to held stack");
        assert.strictEqual(
            wheatFarm.requireEcsComponent(FarmComponentId).state,
            FarmState.Empty,
        );
        assert.strictEqual(
            strawFarm.requireEcsComponent(FarmComponentId).state,
            FarmState.Ready,
            "straw must not be harvested into a wheat-holding slot",
        );
    });
});

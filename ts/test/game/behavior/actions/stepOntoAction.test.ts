import assert from "node:assert";
import { describe, it } from "node:test";
import { EcsWorld } from "../../../../src/common/ecs/ecsWorld.ts";
import { chunkMapSystem } from "../../../../src/game/system/chunkMapSystem.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../../src/game/component/tileComponent.ts";
import { createChunkMapComponent } from "../../../../src/game/component/chunkMapComponent.ts";
import { createPathfindingGraphComponent } from "../../../../src/game/component/pathfindingGraphComponent.ts";
import { createLazyGraphFromRootNode } from "../../../../src/game/map/path/graph/generateGraph.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { createSpriteComponent } from "../../../../src/game/component/spriteComponent.ts";
import { createBuildingComponent } from "../../../../src/game/component/buildingComponent.ts";
import { createBehaviorAgentComponent } from "../../../../src/game/component/BehaviorAgentComponent.ts";
import { createMovementStaminaComponent } from "../../../../src/game/component/movementStaminaComponent.ts";
import { nullBuilding } from "../../../../src/data/building/building.ts";
import { executeStepOntoAction } from "../../../../src/game/behavior/actions/stepOntoAction.ts";
import { executeMoveToAction } from "../../../../src/game/behavior/actions/moveToAction.ts";
import {
    isPointAdjacentTo,
    pointEquals,
    type Point,
} from "../../../../src/common/point.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/ActionData.ts";
import type { SpriteRef } from "../../../../src/asset/sprite.ts";

type MoveToAction = Extract<BehaviorActionData, { type: "moveTo" }>;

const testSprite: SpriteRef = { bin: "test", spriteId: "test" };

/** Open world with tiles, chunk map, and pathfinding (covers x=8..31, y=8..15). */
function createWorld(): Entity {
    const ecsWorld = new EcsWorld();
    ecsWorld.addSystem(chunkMapSystem);
    const root = ecsWorld.root;

    const tileComponent = createTileComponent();
    for (let cx = 1; cx <= 3; cx++) {
        setChunk(tileComponent, { chunkX: cx, chunkY: 1 });
    }
    root.setEcsComponent(tileComponent);
    root.setEcsComponent(createChunkMapComponent());
    root.setEcsComponent(
        createPathfindingGraphComponent(createLazyGraphFromRootNode(root)),
    );
    return root;
}

function addBuilding(root: Entity, id: string, position: Point): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(testSprite));
    entity.setEcsComponent(createBuildingComponent(nullBuilding, false));
    root.addChild(entity);
    entity.worldPosition = position;
    return entity;
}

function addWorker(root: Entity, id: string, position: Point): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(testSprite));
    entity.setEcsComponent(createBehaviorAgentComponent());
    entity.setEcsComponent(createMovementStaminaComponent());
    root.addChild(entity);
    entity.worldPosition = position;
    return entity;
}

describe("stepOntoAction", () => {
    it("mounts the target's tile from an adjacent tile", () => {
        const root = createWorld();
        const building = addBuilding(root, "building", { x: 12, y: 8 });
        const worker = addWorker(root, "worker", { x: 11, y: 8 });

        const result = executeStepOntoAction(
            { type: "stepOnto", targetId: "building" },
            worker,
            1,
        );

        assert.strictEqual(result.kind, "complete");
        assert.deepStrictEqual(worker.worldPosition, building.worldPosition);
    });

    it("completes as a no-op when already on the target tile", () => {
        const root = createWorld();
        addBuilding(root, "building", { x: 12, y: 8 });
        const worker = addWorker(root, "worker", { x: 12, y: 8 });

        const result = executeStepOntoAction(
            { type: "stepOnto", targetId: "building" },
            worker,
            1,
        );

        assert.strictEqual(result.kind, "complete");
        assert.deepStrictEqual(worker.worldPosition, { x: 12, y: 8 });
    });

    it("fails when the worker is not adjacent to the target", () => {
        const root = createWorld();
        addBuilding(root, "building", { x: 12, y: 8 });
        const worker = addWorker(root, "worker", { x: 15, y: 8 });

        const result = executeStepOntoAction(
            { type: "stepOnto", targetId: "building" },
            worker,
            1,
        );

        assert.strictEqual(result.kind, "failed");
        assert.deepStrictEqual(worker.worldPosition, { x: 15, y: 8 });
    });

    it("fails when the target entity is gone", () => {
        const root = createWorld();
        const worker = addWorker(root, "worker", { x: 11, y: 8 });

        const result = executeStepOntoAction(
            { type: "stepOnto", targetId: "missing" },
            worker,
            1,
        );

        assert.strictEqual(result.kind, "failed");
    });
});

describe("stepping off a building (emergent via moveTo)", () => {
    /**
     * Locks in the property that lets stepOnto work without a companion
     * "step off" action: A* never weights the start node, and the building
     * tile still exists as a graph node, so a worker standing on top of an
     * impassable building can plan a path out. The first step lands on an
     * adjacent walkable tile. If a future change adds a "start tile must be
     * walkable" guard to movement, this test fails loudly.
     */
    it("steps off onto an adjacent walkable tile toward the destination", () => {
        const root = createWorld();
        const building = addBuilding(root, "building", { x: 12, y: 8 });
        // Worker is mounted on the building tile, as it would be after stepOnto.
        const worker = addWorker(root, "worker", { x: 12, y: 8 });

        const action: MoveToAction = {
            type: "moveTo",
            target: { x: 15, y: 8 },
        };

        const result = executeMoveToAction(action, worker, 1);

        assert.notStrictEqual(
            result.kind,
            "failed",
            "moveTo from a building tile must not fail",
        );
        assert.ok(
            !pointEquals(worker.worldPosition, building.worldPosition),
            "worker should have stepped off the building tile",
        );
        assert.ok(
            isPointAdjacentTo(worker.worldPosition, building.worldPosition),
            `first step should be an adjacent tile, was ${JSON.stringify(
                worker.worldPosition,
            )}`,
        );
    });
});

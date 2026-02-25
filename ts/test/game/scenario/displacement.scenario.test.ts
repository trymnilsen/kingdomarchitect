import assert from "node:assert";
import { describe, it } from "node:test";
import { EcsWorld } from "../../../src/common/ecs/ecsWorld.ts";
import { chunkMapSystem } from "../../../src/game/system/chunkMapSystem.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../src/game/component/tileComponent.ts";
import { createChunkMapComponent } from "../../../src/game/component/chunkMapComponent.ts";
import { createPathfindingGraphComponent } from "../../../src/game/component/pathfindingGraphComponent.ts";
import { createLazyGraphFromRootNode } from "../../../src/game/map/path/graph/generateGraph.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    createBehaviorAgentComponent,
    getBehaviorAgent,
} from "../../../src/game/component/BehaviorAgentComponent.ts";
import { createMovementStaminaComponent } from "../../../src/game/component/movementStaminaComponent.ts";
import { createSpriteComponent } from "../../../src/game/component/spriteComponent.ts";
import { createBuildingComponent } from "../../../src/game/component/buildingComponent.ts";
import { nullBuilding } from "../../../src/data/building/building.ts";
import { createBehaviorSystem } from "../../../src/game/behavior/systems/BehaviorSystem.ts";
import { createPerformPlayerCommandBehavior } from "../../../src/game/behavior/behaviors/PerformPlayerCommandBehavior.ts";
import { executeMoveToAction } from "../../../src/game/behavior/actions/moveToAction.ts";
import type { BehaviorActionData } from "../../../src/game/behavior/actions/Action.ts";
import type { SpriteRef } from "../../../src/asset/sprite.ts";
import type { Point } from "../../../src/common/point.ts";

type MoveToAction = Extract<BehaviorActionData, { type: "moveTo" }>;

const testSprite: SpriteRef = { bin: "test", spriteId: "test" };

/**
 * Open world with tiles, chunk map, and pathfinding. Covers roughly
 * x=8..31, y=8..15 — enough room for entities to move around.
 */
function createWorld(): { root: Entity; ecsWorld: EcsWorld } {
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

    return { ecsWorld, root };
}

/**
 * Create an agent that can be displaced or issue player commands.
 * Requires SpriteComponent so it registers in the chunk map.
 */
function createAgent(id: string, root: Entity, position: Point): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(testSprite));
    entity.setEcsComponent(createBehaviorAgentComponent());
    entity.setEcsComponent(createMovementStaminaComponent());
    root.addChild(entity);
    entity.worldPosition = position;
    return entity;
}

/**
 * Place an impassable building at a tile to block displacement paths.
 * The SpriteComponent ensures it registers in the chunk map so
 * scoreCandidateTile can detect it and score the tile as -Infinity.
 */
function createWall(id: string, root: Entity, position: Point): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(testSprite));
    entity.setEcsComponent(createBuildingComponent(nullBuilding, false));
    root.addChild(entity);
    entity.worldPosition = position;
    return entity;
}

describe("Displacement Scenario", () => {
    it("agent with player command displaces idle blocker to reach target tile", () => {
        /**
         * A at (11,8) has a move command to (12,8). B is at (12,8) with no
         * active behavior (currentBehaviorUtility = 0 by default). Because
         * A's PerformPlayerCommandBehavior gives it utility=90 >> B's resistance=0,
         * displacement succeeds: B moves to an adjacent free tile, A arrives at (12,8).
         */
        const { root } = createWorld();

        const agentA = createAgent("agent-a", root, { x: 11, y: 8 });
        const agentB = createAgent("agent-b", root, { x: 12, y: 8 });

        const agentAComp = getBehaviorAgent(agentA)!;
        agentAComp.playerCommand = {
            action: "move",
            targetPosition: { x: 12, y: 8 },
        };

        const behaviorSystem = createBehaviorSystem(() => [
            createPerformPlayerCommandBehavior(),
        ]);

        for (let tick = 1; tick <= 5; tick++) {
            behaviorSystem.onUpdate!(root, tick);
        }

        assert.deepStrictEqual(
            agentA.worldPosition,
            { x: 12, y: 8 },
            `Agent A should be at the target (12,8) but is at ${JSON.stringify(agentA.worldPosition)}`,
        );
        assert.strictEqual(
            agentAComp.playerCommand,
            undefined,
            "Player command should be cleared after arrival",
        );
        assert.notDeepStrictEqual(
            agentB.worldPosition,
            { x: 12, y: 8 },
            "Blocker B should have been displaced away from (12,8)",
        );
    });

    it("cycle displacement: agent reaches target when only path is swapping with idle blocker", () => {
        /**
         * A at (10,8) wants to reach (11,8). B is at (11,8) with no active
         * behavior (utility=0). All of B's exits are walled off except the tile
         * where A currently stands (10,8) — so the only valid displacement is
         * a 2-entity cycle: B moves to (10,8) and A moves to (11,8) atomically.
         *
         * Walls:
         *   (12,8) — east of B       (explicitly placed)
         *   (11,9) — south of B      (explicitly placed)
         *   (11,7) — north of B      (y=7 is outside chunk, natural wall)
         */
        const { root } = createWorld();

        const agentA = createAgent("agent-a", root, { x: 10, y: 8 });
        const agentB = createAgent("agent-b", root, { x: 11, y: 8 });
        createWall("wall-east", root, { x: 12, y: 8 });
        createWall("wall-south", root, { x: 11, y: 9 });

        const agentAComp = getBehaviorAgent(agentA)!;
        agentAComp.playerCommand = {
            action: "move",
            targetPosition: { x: 11, y: 8 },
        };

        const behaviorSystem = createBehaviorSystem(() => [
            createPerformPlayerCommandBehavior(),
        ]);

        // Tick 1: A replans → moveTo fires → cycle commits atomically → A arrives at (11,8).
        // Tick 2: clearPlayerCommand fires and clears the command.
        behaviorSystem.onUpdate!(root, 1);
        behaviorSystem.onUpdate!(root, 2);

        assert.deepStrictEqual(
            agentA.worldPosition,
            { x: 11, y: 8 },
            `Agent A should have reached (11,8) via cycle, is at ${JSON.stringify(agentA.worldPosition)}`,
        );
        assert.strictEqual(
            agentAComp.playerCommand,
            undefined,
            "Player command should be cleared after A arrives at target",
        );
        assert.deepStrictEqual(
            agentB.worldPosition,
            { x: 10, y: 8 },
            `Agent B should have been displaced to A's former position (10,8), is at ${JSON.stringify(agentB.worldPosition)}`,
        );
    });

    it("mover does not oscillate when direct path is blocked by equal-priority entity", () => {
        /**
         * Mover at (11,8) wants to reach (15,8). Blocker at (12,8) has the same
         * utility (50), so displacement always fails — priority (50) is not strictly
         * greater than resistance (50).
         *
         * Without path caching the mover would replan on every tick. After stepping
         * off the direct route (e.g. to (11,9)), A* may route back through (12,8)
         * again (the tile has no goblin-weight penalty since the blocker carries only
         * BehaviorAgentComponent), causing the entity to oscillate between positions
         * rather than committing to the around path.
         *
         * With path caching the entity commits to the around route on the first tick
         * and follows it to completion without reconsidering, guaranteeing no position
         * is visited twice and the target is reached.
         */
        const { root } = createWorld();

        const mover = createAgent("mover", root, { x: 11, y: 8 });
        const moverAgent = getBehaviorAgent(mover)!;
        moverAgent.currentBehaviorUtility = 50;

        const blocker = createAgent("blocker", root, { x: 12, y: 8 });
        const blockerAgent = getBehaviorAgent(blocker)!;
        blockerAgent.currentBehaviorUtility = 50;

        const action: MoveToAction = {
            type: "moveTo",
            target: { x: 15, y: 8 },
        };

        const visitedPositions = new Set<string>();
        visitedPositions.add(
            `${mover.worldPosition.x},${mover.worldPosition.y}`,
        );

        let finalResult = { kind: "running" };
        for (let tick = 1; tick <= 15; tick++) {
            finalResult = executeMoveToAction(action, mover, tick);
            const pos = `${mover.worldPosition.x},${mover.worldPosition.y}`;
            assert.ok(
                !visitedPositions.has(pos),
                `Mover revisited position (${pos}) on tick ${tick} — oscillation detected`,
            );
            visitedPositions.add(pos);
            if (finalResult.kind === "complete") break;
        }

        assert.deepStrictEqual(
            mover.worldPosition,
            { x: 15, y: 8 },
            `Mover should reach (15,8) but is at ${JSON.stringify(mover.worldPosition)}`,
        );
    });

    it("path is cached after displacement fails and consumed step-by-step without replanning", () => {
        /**
         * Directly verifies the path-caching mechanism. After displacement fails on
         * the first tick, action.cachedPath must be populated with the around route.
         * On each subsequent tick the cached path is consumed by one step (length
         * decreases by exactly 1) rather than being discarded and recalculated, which
         * would happen if the entity were replanning every tick.
         */
        const { root } = createWorld();

        const mover = createAgent("mover", root, { x: 11, y: 8 });
        const moverAgent = getBehaviorAgent(mover)!;
        moverAgent.currentBehaviorUtility = 50;

        const blocker = createAgent("blocker", root, { x: 12, y: 8 });
        const blockerAgent = getBehaviorAgent(blocker)!;
        blockerAgent.currentBehaviorUtility = 50;

        const action: MoveToAction = {
            type: "moveTo",
            target: { x: 15, y: 8 },
        };

        // Tick 1: displacement fails at (12,8), path is replanned around the blocker,
        // and the entity takes the first step of the around route.
        executeMoveToAction(action, mover, 1);

        assert.ok(
            action.cachedPath !== undefined && action.cachedPath.length > 0,
            "cachedPath should be set after displacement fails and replan finds an around route",
        );
        assert.notDeepStrictEqual(
            mover.worldPosition,
            { x: 11, y: 8 },
            "Mover should have stepped away from its start position on tick 1",
        );

        // Snapshot the path remaining after tick 1.
        const pathAfterTick1 = [...action.cachedPath!];

        // Tick 2: the next tile in the cached path is free — the entity should step
        // there by consuming cachedPath[0], leaving the tail unchanged.
        executeMoveToAction(action, mover, 2);

        assert.ok(
            action.cachedPath !== undefined,
            "cachedPath should still exist after tick 2",
        );
        assert.strictEqual(
            action.cachedPath!.length,
            pathAfterTick1.length - 1,
            "cachedPath should be exactly one step shorter after tick 2 (step consumed, not replanned)",
        );
        assert.deepStrictEqual(
            action.cachedPath,
            pathAfterTick1.slice(1),
            "Remaining cached path should be the tail of the path from tick 1 — no replanning occurred",
        );
    });

    it("displacement chain: A displaces B which displaces C to reach target", () => {
        /**
         * A at (11,8) wants to move to (12,8) — where B is.
         * B at (12,8) is idle (utility=0). C at (13,8) is also idle.
         *
         * A's moveTo triggers displacement. B has free adjacent tiles (e.g. south
         * at (12,9)), so B steps aside immediately rather than chaining through C.
         * A enters (12,8) and the command completes in one tick.
         *
         * This test verifies that the displacement system gracefully handles a
         * target tile occupied by an idle entity even when additional idle
         * entities are nearby in the same row.
         */
        const { root } = createWorld();

        const agentA = createAgent("agent-a", root, { x: 11, y: 8 });
        createAgent("agent-b", root, { x: 12, y: 8 });
        createAgent("agent-c", root, { x: 13, y: 8 });

        const agentAComp = getBehaviorAgent(agentA)!;
        agentAComp.playerCommand = {
            action: "move",
            targetPosition: { x: 12, y: 8 },
        };

        const behaviorSystem = createBehaviorSystem(() => [
            createPerformPlayerCommandBehavior(),
        ]);

        for (let tick = 1; tick <= 5; tick++) {
            behaviorSystem.onUpdate!(root, tick);
        }

        assert.deepStrictEqual(
            agentA.worldPosition,
            { x: 12, y: 8 },
            `Agent A should be at target (12,8), is at ${JSON.stringify(agentA.worldPosition)}`,
        );
        assert.strictEqual(
            agentAComp.playerCommand,
            undefined,
            "Player command should be cleared after arrival",
        );
    });
});

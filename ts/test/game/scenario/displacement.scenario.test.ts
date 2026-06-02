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
import type { BehaviorActionData } from "../../../src/game/behavior/actions/ActionData.ts";
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
    // Start "settled": a fresh agent carries pendingReplan, which marks it transient
    // (waited-for, not displaced). A plain placed agent is a settled obstacle until it
    // is given something to do; moveCommand re-arms pendingReplan so commanded workers
    // plan and move.
    getBehaviorAgent(entity)!.pendingReplan = undefined;
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
        moveCommand(agentA, { x: 12, y: 8 });

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
        moveCommand(agentA, { x: 11, y: 8 });

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

    it("waits for a transient (walking) blocker, keeping its path, then proceeds when it clears", () => {
        const { root } = createWorld();

        const mover = createAgent("mover", root, { x: 11, y: 8 });
        getBehaviorAgent(mover)!.currentBehaviorUtility = 50;

        // Blocker is in transit (a moveTo at its queue head) → transient → waited-for,
        // never shoved off its route.
        const blocker = createAgent("blocker", root, { x: 12, y: 8 });
        getBehaviorAgent(blocker)!.actionQueue = [
            { type: "moveTo", target: { x: 12, y: 11 } },
        ];

        const action: MoveToAction = { type: "moveTo", target: { x: 15, y: 8 } };

        // Tick 1: next tile (12,8) holds a transient blocker → mover holds position and
        // keeps its cached path aimed at the same tile (no replan, no detour).
        executeMoveToAction(action, mover, 1);
        assert.deepStrictEqual(
            mover.worldPosition,
            { x: 11, y: 8 },
            "mover should wait in place for the walking blocker",
        );
        assert.ok(
            action.cachedPath && action.cachedPath.length > 0,
            "cached path is preserved while waiting",
        );
        assert.deepStrictEqual(
            action.cachedPath![0],
            { x: 12, y: 8 },
            "still aimed at the same next tile",
        );

        // Blocker walks away.
        blocker.worldPosition = { x: 12, y: 11 };

        // Tick 2: the tile is now free → mover advances into it.
        executeMoveToAction(action, mover, 2);
        assert.deepStrictEqual(
            mover.worldPosition,
            { x: 12, y: 8 },
            "mover advances once the blocker has cleared",
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
        moveCommand(agentA, { x: 12, y: 8 });

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

    /**
     * Seal y=8 into a true 1-wide corridor: y=7 is outside the chunk (natural wall)
     * and we wall the entire y=9 row across the chunk width (x=8..31) so there is no
     * way around — a refused worker cannot detour, making a swap the only resolution.
     */
    function sealCorridor(root: Entity) {
        for (let x = 8; x <= 31; x++) {
            createWall(`wall-${x}`, root, { x, y: 9 });
        }
    }

    /** Assert no two entities occupy the same tile this tick. */
    function assertNoOverlap(entities: Entity[], tick: number) {
        const seen = new Set<string>();
        for (const e of entities) {
            const key = `${e.worldPosition.x},${e.worldPosition.y}`;
            assert.ok(
                !seen.has(key),
                `Two entities share tile ${key} on tick ${tick}`,
            );
            seen.add(key);
        }
    }

    function moveCommand(entity: Entity, target: Point) {
        const agent = getBehaviorAgent(entity)!;
        agent.playerCommand = {
            action: "move",
            targetPosition: target,
        };
        // Re-arm replanning so the commanded worker plans and starts moving (createAgent
        // leaves agents settled).
        agent.pendingReplan = { kind: "replan" };
    }

    it("two equal-priority workers swap past each other in a 1-wide corridor", () => {
        /**
         * A at (10,8) wants (13,8); B at (13,8) wants (10,8). y=9 is walled, y=7 is
         * outside the chunk — so the row is a 1-wide corridor with no way around.
         * The only way both reach their targets is a head-on swap. With equal
         * priority the old dominance gate would deadlock them forever.
         */
        const { root } = createWorld();
        sealCorridor(root);

        const a = createAgent("a", root, { x: 10, y: 8 });
        const b = createAgent("b", root, { x: 13, y: 8 });
        moveCommand(a, { x: 13, y: 8 });
        moveCommand(b, { x: 10, y: 8 });

        const behaviorSystem = createBehaviorSystem(() => [
            createPerformPlayerCommandBehavior(),
        ]);

        let prevA = { ...a.worldPosition };
        let prevB = { ...b.worldPosition };
        for (let tick = 1; tick <= 12; tick++) {
            behaviorSystem.onUpdate!(root, tick);
            assertNoOverlap([a, b], tick);
            // No worker advances more than one tile per tick.
            const da =
                Math.abs(a.worldPosition.x - prevA.x) +
                Math.abs(a.worldPosition.y - prevA.y);
            const db =
                Math.abs(b.worldPosition.x - prevB.x) +
                Math.abs(b.worldPosition.y - prevB.y);
            assert.ok(da <= 1, `A moved ${da} tiles on tick ${tick}`);
            assert.ok(db <= 1, `B moved ${db} tiles on tick ${tick}`);
            prevA = { ...a.worldPosition };
            prevB = { ...b.worldPosition };
        }

        assert.deepStrictEqual(a.worldPosition, { x: 13, y: 8 });
        assert.deepStrictEqual(b.worldPosition, { x: 10, y: 8 });
    });

    it("two workers spawned face-to-face in a sealed corridor resolve", () => {
        /**
         * Planless / spawned-adjacent head-on: two workers become adjacent before either
         * has a committed path. On tick 1 the first to act finds the other still
         * undecided (pendingReplan set) → transient → it waits, keeping its computed
         * path. The second then plans, sees the first's path heading into its tile, and
         * the existing beneficial swap fires — both reach their goals the same tick.
         */
        const { root } = createWorld();
        sealCorridor(root);

        const a = createAgent("a", root, { x: 11, y: 8 });
        const b = createAgent("b", root, { x: 12, y: 8 });
        moveCommand(a, { x: 12, y: 8 });
        moveCommand(b, { x: 11, y: 8 });

        const behaviorSystem = createBehaviorSystem(() => [
            createPerformPlayerCommandBehavior(),
        ]);

        for (let tick = 1; tick <= 6; tick++) {
            behaviorSystem.onUpdate!(root, tick);
            assertNoOverlap([a, b], tick);
            if (a.worldPosition.x === 12 && b.worldPosition.x === 11) break;
        }

        assert.deepStrictEqual(a.worldPosition, { x: 12, y: 8 });
        assert.deepStrictEqual(b.worldPosition, { x: 11, y: 8 });
    });

    it("one worker passes two oncoming workers in a 1-wide corridor", () => {
        // Groups approach from a distance (as in real gameplay) so each worker has a
        // committed cached path by the time the streams meet — the swap is detected
        // from cachedPath[0]. (Starting workers already adjacent would not resolve
        // until the deferred "in-transit is cheap to displace" resistance change.)
        const { root } = createWorld();
        sealCorridor(root);

        const a = createAgent("a", root, { x: 9, y: 8 }); // heading right
        const b = createAgent("b", root, { x: 13, y: 8 }); // heading left (leads)
        const c = createAgent("c", root, { x: 14, y: 8 }); // heading left (follows b)
        moveCommand(a, { x: 14, y: 8 });
        moveCommand(b, { x: 8, y: 8 });
        moveCommand(c, { x: 9, y: 8 });

        const behaviorSystem = createBehaviorSystem(() => [
            createPerformPlayerCommandBehavior(),
        ]);

        for (let tick = 1; tick <= 20; tick++) {
            behaviorSystem.onUpdate!(root, tick);
            assertNoOverlap([a, b, c], tick);
        }

        assert.deepStrictEqual(a.worldPosition, { x: 14, y: 8 });
        assert.deepStrictEqual(b.worldPosition, { x: 8, y: 8 });
        assert.deepStrictEqual(c.worldPosition, { x: 9, y: 8 });
    });

    it("two workers pass two oncoming workers in a 1-wide corridor", () => {
        // Two groups approaching from a distance (see note above).
        const { root } = createWorld();
        sealCorridor(root);

        const a = createAgent("a", root, { x: 9, y: 8 }); // heading right (follows b)
        const b = createAgent("b", root, { x: 10, y: 8 }); // heading right (leads)
        const c = createAgent("c", root, { x: 14, y: 8 }); // heading left (leads)
        const d = createAgent("d", root, { x: 15, y: 8 }); // heading left (follows c)
        moveCommand(a, { x: 15, y: 8 });
        moveCommand(b, { x: 16, y: 8 });
        moveCommand(c, { x: 8, y: 8 });
        moveCommand(d, { x: 9, y: 8 });

        const behaviorSystem = createBehaviorSystem(() => [
            createPerformPlayerCommandBehavior(),
        ]);

        for (let tick = 1; tick <= 30; tick++) {
            behaviorSystem.onUpdate!(root, tick);
            assertNoOverlap([a, b, c, d], tick);
        }

        assert.deepStrictEqual(a.worldPosition, { x: 15, y: 8 });
        assert.deepStrictEqual(b.worldPosition, { x: 16, y: 8 });
        assert.deepStrictEqual(c.worldPosition, { x: 8, y: 8 });
        assert.deepStrictEqual(d.worldPosition, { x: 9, y: 8 });
    });
});

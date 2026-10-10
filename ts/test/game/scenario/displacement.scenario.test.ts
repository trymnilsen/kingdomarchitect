import assert from "node:assert";
import { describe, it } from "node:test";
import type { Entity } from "../../../src/game/entity/entity.ts";
import {
    BehaviorAgentComponentId,
    getBehaviorAgent,
} from "../../../src/game/component/behaviorAgentComponent.ts";
import { recordMove } from "../../../src/game/component/movementStaminaComponent.ts";
import { createBehaviorSystem } from "../../../src/game/behavior/systems/behaviorSystem.ts";
import { createPerformPlayerCommandBehavior } from "../../../src/game/behavior/behaviors/performPlayerCommandBehavior.ts";
import {
    executeMoveToAction,
    type MoveToActionData,
} from "../../../src/game/behavior/actions/moveToAction.ts";
import type { Point } from "../../../src/common/point.ts";
import {
    createAgent,
    createTestWorld,
    createWall,
    createWalker,
    testWorldBounds,
} from "../behavior/displacement/displacementTestWorld.ts";

/** Walls off row y=9, which with the world wall at y=7 leaves y=8 one tile wide. */
function sealCorridor(root: Entity) {
    for (let x = testWorldBounds.x1; x <= testWorldBounds.x2; x++) {
        createWall(`wall-${x}`, root, x, 9);
    }
}

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

function assertOneTileAtMost(
    entities: Entity[],
    previous: Point[],
    tick: number,
) {
    entities.forEach((entity, index) => {
        const step =
            Math.abs(entity.worldPosition.x - previous[index].x) +
            Math.abs(entity.worldPosition.y - previous[index].y);
        assert.ok(
            step <= 1,
            `${entity.id} moved ${step} tiles on tick ${tick}`,
        );
    });
}

/** The behavior system takes agents in this order, which the test relies on. */
function assertProcessingOrder(root: Entity, ids: string[]) {
    const order = Array.from(
        root.queryComponents(BehaviorAgentComponentId),
        ([entity]) => entity.id,
    );
    assert.deepStrictEqual(order, ids);
}

function moveCommand(entity: Entity, target: Point) {
    const agent = getBehaviorAgent(entity)!;
    agent.playerCommand = {
        action: "move",
        targetPosition: target,
    };
    agent.pendingReplan = { kind: "replan" };
}

function walkingRoute(entity: Entity): MoveToActionData {
    const head = getBehaviorAgent(entity)!.actionQueue[0];
    assert.ok(head.type === "moveTo");
    return head;
}

describe("Displacement Scenario", () => {
    it("agent with player command displaces idle blocker to reach target tile", () => {
        const { root } = createTestWorld();
        const agentA = createAgent("agent-a", root, 11, 8);
        const agentB = createAgent("agent-b", root, 12, 8);
        moveCommand(agentA, { x: 12, y: 8 });

        const behaviorSystem = createBehaviorSystem(() => [
            createPerformPlayerCommandBehavior(),
        ]);
        for (let tick = 1; tick <= 5; tick++) {
            behaviorSystem.onUpdate!(root, tick);
        }

        assert.deepStrictEqual(agentA.worldPosition, { x: 12, y: 8 });
        assert.strictEqual(getBehaviorAgent(agentA)!.playerCommand, undefined);
        assert.notDeepStrictEqual(agentB.worldPosition, { x: 12, y: 8 });
    });

    it("agent reaches its target by swapping with a boxed-in idle blocker", () => {
        const { root } = createTestWorld();
        const agentA = createAgent("agent-a", root, 10, 8);
        const agentB = createAgent("agent-b", root, 11, 8);
        createWall("wall-east", root, 12, 8);
        createWall("wall-south", root, 11, 9);
        moveCommand(agentA, { x: 11, y: 8 });

        const behaviorSystem = createBehaviorSystem(() => [
            createPerformPlayerCommandBehavior(),
        ]);
        behaviorSystem.onUpdate!(root, 1);
        behaviorSystem.onUpdate!(root, 2);

        assert.deepStrictEqual(agentA.worldPosition, { x: 11, y: 8 });
        assert.strictEqual(getBehaviorAgent(agentA)!.playerCommand, undefined);
        assert.deepStrictEqual(agentB.worldPosition, { x: 10, y: 8 });
    });

    it("walks on without losing a tick after swapping with a boxed-in blocker", () => {
        // The blocker's only way out is the walker's tile, because the tile
        // beyond holds another walker. The walker must keep moving one tile a
        // tick straight through the swap.
        const { root } = createTestWorld();
        sealCorridor(root);
        const walker = createWalker("walker", root, 10, 8, [
            { x: 11, y: 8 },
            { x: 12, y: 8 },
            { x: 13, y: 8 },
            { x: 14, y: 8 },
        ]);
        const blocker = createAgent("blocker", root, 11, 8);
        createWalker("ahead", root, 12, 8, [
            { x: 13, y: 8 },
            { x: 14, y: 8 },
            { x: 15, y: 8 },
            { x: 16, y: 8 },
            { x: 17, y: 8 },
        ]);
        assertProcessingOrder(root, ["walker", "blocker", "ahead"]);

        const behaviorSystem = createBehaviorSystem(() => []);
        for (let tick = 1; tick <= 4; tick++) {
            behaviorSystem.onUpdate!(root, tick);
            assert.deepStrictEqual(walker.worldPosition, {
                x: 10 + tick,
                y: 8,
            });
        }
        assert.deepStrictEqual(blocker.worldPosition, { x: 10, y: 8 });
    });

    it("mover does not oscillate when direct path is blocked by equal-priority entity", () => {
        // Without a cached route, A* could lead back through the blocker after
        // the first detour step and the mover would pace back and forth
        const { root } = createTestWorld();
        const mover = createAgent("mover", root, 11, 8, 50);
        createAgent("blocker", root, 12, 8, 50);
        const action: MoveToActionData = {
            type: "moveTo",
            target: { x: 15, y: 8 },
        };

        const visitedPositions = new Set<string>(["11,8"]);
        for (let tick = 1; tick <= 15; tick++) {
            const result = executeMoveToAction(action, mover, tick);
            const pos = `${mover.worldPosition.x},${mover.worldPosition.y}`;
            assert.ok(
                !visitedPositions.has(pos),
                `Mover revisited position (${pos}) on tick ${tick}`,
            );
            visitedPositions.add(pos);
            if (result.kind === "complete") break;
        }

        assert.deepStrictEqual(mover.worldPosition, { x: 15, y: 8 });
    });

    it("path is cached after displacement fails and consumed step-by-step without replanning", () => {
        const { root } = createTestWorld();
        const mover = createAgent("mover", root, 11, 8, 50);
        createAgent("blocker", root, 12, 8, 50);
        const action: MoveToActionData = {
            type: "moveTo",
            target: { x: 15, y: 8 },
        };

        executeMoveToAction(action, mover, 1);
        assert.ok(action.cachedPath && action.cachedPath.length > 0);
        assert.notDeepStrictEqual(mover.worldPosition, { x: 11, y: 8 });
        const pathAfterTick1 = [...action.cachedPath];

        executeMoveToAction(action, mover, 2);
        assert.deepStrictEqual(action.cachedPath, pathAfterTick1.slice(1));
    });

    it("waits for a transient (walking) blocker, keeping its path, then proceeds when it clears", () => {
        const { root } = createTestWorld();
        const mover = createAgent("mover", root, 11, 8, 50);
        const blocker = createAgent("blocker", root, 12, 8);
        getBehaviorAgent(blocker)!.actionQueue = [
            { type: "moveTo", target: { x: 12, y: 11 } },
        ];
        const action: MoveToActionData = {
            type: "moveTo",
            target: { x: 15, y: 8 },
        };

        executeMoveToAction(action, mover, 1);
        assert.deepStrictEqual(mover.worldPosition, { x: 11, y: 8 });
        assert.deepStrictEqual(action.cachedPath?.[0], { x: 12, y: 8 });

        blocker.worldPosition = { x: 12, y: 11 };
        executeMoveToAction(action, mover, 2);
        assert.deepStrictEqual(mover.worldPosition, { x: 12, y: 8 });
    });

    it("keeps its route when a rotation goes stale, and rotates the tick after", () => {
        // The oncoming walker was already stepped this tick, so the swap
        // cannot commit now. That is timing, not a wall.
        const { root } = createTestWorld();
        const walker = createWalker("walker", root, 10, 8, [
            { x: 11, y: 8 },
            { x: 12, y: 8 },
        ]);
        const oncoming = createWalker("oncoming", root, 11, 8, [
            { x: 10, y: 8 },
            { x: 9, y: 8 },
        ]);
        recordMove(oncoming.getEcsComponent("MovementStamina")!, 1);
        const route = walkingRoute(walker);
        const pathBefore = [...route.cachedPath!];

        executeMoveToAction(route, walker, 1);
        assert.deepStrictEqual(walker.worldPosition, { x: 10, y: 8 });
        assert.deepStrictEqual(route.cachedPath, pathBefore);

        executeMoveToAction(route, walker, 2);
        assert.deepStrictEqual(walker.worldPosition, { x: 11, y: 8 });
        assert.deepStrictEqual(oncoming.worldPosition, { x: 10, y: 8 });
        assert.deepStrictEqual(route.cachedPath, pathBefore.slice(1));
    });

    it("two equal-priority workers swap past each other in a 1-wide corridor", () => {
        const { root } = createTestWorld();
        sealCorridor(root);
        const a = createAgent("a", root, 10, 8);
        const b = createAgent("b", root, 13, 8);
        moveCommand(a, { x: 13, y: 8 });
        moveCommand(b, { x: 10, y: 8 });

        const behaviorSystem = createBehaviorSystem(() => [
            createPerformPlayerCommandBehavior(),
        ]);
        let previous = [{ ...a.worldPosition }, { ...b.worldPosition }];
        for (let tick = 1; tick <= 12; tick++) {
            behaviorSystem.onUpdate!(root, tick);
            assertNoOverlap([a, b], tick);
            assertOneTileAtMost([a, b], previous, tick);
            previous = [{ ...a.worldPosition }, { ...b.worldPosition }];
        }

        assert.deepStrictEqual(a.worldPosition, { x: 13, y: 8 });
        assert.deepStrictEqual(b.worldPosition, { x: 10, y: 8 });
    });

    it("two workers spawned face-to-face in a sealed corridor resolve", () => {
        // Neither has a route on tick 1. The first waits on the undecided
        // second, which then plans and rotates with it.
        const { root } = createTestWorld();
        sealCorridor(root);
        const a = createAgent("a", root, 11, 8);
        const b = createAgent("b", root, 12, 8);
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

    it("four walkers turning around a 2x2 square, with one queued behind, all get through", () => {
        // The jam from the field. E queues behind the square and goes first,
        // so it meets the loop before any member has had its turn.
        const { root } = createTestWorld();
        const e = createWalker("e", root, 11, 10, [{ x: 12, y: 10 }]);
        const a = createWalker("a", root, 12, 10, [
            { x: 13, y: 10 },
            { x: 14, y: 10 },
        ]);
        const b = createWalker("b", root, 13, 10, [
            { x: 13, y: 11 },
            { x: 13, y: 12 },
        ]);
        const c = createWalker("c", root, 13, 11, [
            { x: 12, y: 11 },
            { x: 11, y: 11 },
        ]);
        const d = createWalker("d", root, 12, 11, [
            { x: 12, y: 10 },
            { x: 12, y: 9 },
        ]);
        const walkers = [e, a, b, c, d];
        assertProcessingOrder(root, ["e", "a", "b", "c", "d"]);

        const behaviorSystem = createBehaviorSystem(() => []);
        let previous = walkers.map((walker) => ({ ...walker.worldPosition }));
        for (let tick = 1; tick <= 8; tick++) {
            behaviorSystem.onUpdate!(root, tick);
            assertNoOverlap(walkers, tick);
            assertOneTileAtMost(walkers, previous, tick);
            previous = walkers.map((walker) => ({ ...walker.worldPosition }));
        }

        assert.deepStrictEqual(a.worldPosition, { x: 14, y: 10 });
        assert.deepStrictEqual(b.worldPosition, { x: 13, y: 12 });
        assert.deepStrictEqual(c.worldPosition, { x: 11, y: 11 });
        assert.deepStrictEqual(d.worldPosition, { x: 12, y: 9 });
        assert.deepStrictEqual(e.worldPosition, { x: 12, y: 10 });
    });

    it("two workers pass two oncoming workers in a 1-wide corridor", () => {
        const { root } = createTestWorld();
        sealCorridor(root);
        const a = createAgent("a", root, 9, 8);
        const b = createAgent("b", root, 10, 8);
        const c = createAgent("c", root, 14, 8);
        const d = createAgent("d", root, 15, 8);
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

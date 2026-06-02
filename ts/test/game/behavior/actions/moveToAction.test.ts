import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { executeMoveToAction } from "../../../../src/game/behavior/actions/moveToAction.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/ActionData.ts";
import {
    createMovementStaminaComponent,
    recordMove,
} from "../../../../src/game/component/movementStaminaComponent.ts";

type MoveToAction = Extract<BehaviorActionData, { type: "moveTo" }>;

describe("moveToAction", () => {
    describe("stopAdjacent", () => {
        it("completes when already at target position (no stopAdjacent)", () => {
            const root = new Entity("root");
            const entity = new Entity("entity");
            entity.worldPosition = { x: 5, y: 5 };
            root.addChild(entity);

            const action: MoveToAction = {
                type: "moveTo",
                target: { x: 5, y: 5 },
            };

            const result = executeMoveToAction(action, entity, 1);

            assert.strictEqual(result.kind, "complete");
        });

        it("completes when already adjacent with stopAdjacent: cardinal", () => {
            const root = new Entity("root");
            const entity = new Entity("entity");
            entity.worldPosition = { x: 5, y: 5 };
            root.addChild(entity);

            const action: MoveToAction = {
                type: "moveTo",
                target: { x: 6, y: 5 }, // One tile to the right
                stopAdjacent: "cardinal",
            };

            const result = executeMoveToAction(action, entity, 1);

            assert.strictEqual(result.kind, "complete");
        });

        it("completes when already at target with stopAdjacent: cardinal", () => {
            const root = new Entity("root");
            const entity = new Entity("entity");
            entity.worldPosition = { x: 5, y: 5 };
            root.addChild(entity);

            const action: MoveToAction = {
                type: "moveTo",
                target: { x: 5, y: 5 },
                stopAdjacent: "cardinal",
            };

            const result = executeMoveToAction(action, entity, 1);

            assert.strictEqual(result.kind, "complete");
        });

        it("completes when diagonally adjacent with stopAdjacent: diagonal", () => {
            const root = new Entity("root");
            const entity = new Entity("entity");
            entity.worldPosition = { x: 5, y: 5 };
            root.addChild(entity);

            const action: MoveToAction = {
                type: "moveTo",
                target: { x: 6, y: 6 }, // Diagonally adjacent
                stopAdjacent: "diagonal",
            };

            const result = executeMoveToAction(action, entity, 1);

            assert.strictEqual(result.kind, "complete");
        });

        it("does not complete when diagonally adjacent with stopAdjacent: cardinal", () => {
            const root = new Entity("root");
            const entity = new Entity("entity");
            entity.worldPosition = { x: 5, y: 5 };
            root.addChild(entity);

            const action: MoveToAction = {
                type: "moveTo",
                target: { x: 6, y: 6 }, // Diagonally adjacent
                stopAdjacent: "cardinal",
            };

            const result = executeMoveToAction(action, entity, 1);

            // Without pathfinding graph, movement will fail
            // The key assertion is that it doesn't complete just because diagonal
            assert.notStrictEqual(result.kind, "complete");
        });

        it("does not complete when adjacent without stopAdjacent set", () => {
            const root = new Entity("root");
            const entity = new Entity("entity");
            entity.worldPosition = { x: 5, y: 5 };
            root.addChild(entity);

            const action: MoveToAction = {
                type: "moveTo",
                target: { x: 6, y: 5 }, // Adjacent but no stopAdjacent
            };

            const result = executeMoveToAction(action, entity, 1);

            // Without pathfinding graph, movement will fail
            // The key assertion is that it doesn't complete just because adjacent
            assert.notStrictEqual(result.kind, "complete");
        });

        it("completes for all four cardinal directions", () => {
            const directions = [
                { x: 5, y: 4 }, // Up
                { x: 5, y: 6 }, // Down
                { x: 4, y: 5 }, // Left
                { x: 6, y: 5 }, // Right
            ];

            for (const target of directions) {
                const root = new Entity("root");
                const entity = new Entity("entity");
                entity.worldPosition = { x: 5, y: 5 };
                root.addChild(entity);

                const action: MoveToAction = {
                    type: "moveTo",
                    target,
                    stopAdjacent: "cardinal",
                };

                const result = executeMoveToAction(action, entity, 1);

                assert.strictEqual(
                    result.kind,
                    "complete",
                    `Should complete when adjacent at ${target.x}, ${target.y}`,
                );
            }
        });

        it("completes for all eight diagonal directions", () => {
            const directions = [
                { x: 5, y: 4 }, // Up
                { x: 5, y: 6 }, // Down
                { x: 4, y: 5 }, // Left
                { x: 6, y: 5 }, // Right
                { x: 4, y: 4 }, // Up-Left
                { x: 6, y: 4 }, // Up-Right
                { x: 4, y: 6 }, // Down-Left
                { x: 6, y: 6 }, // Down-Right
            ];

            for (const target of directions) {
                const root = new Entity("root");
                const entity = new Entity("entity");
                entity.worldPosition = { x: 5, y: 5 };
                root.addChild(entity);

                const action: MoveToAction = {
                    type: "moveTo",
                    target,
                    stopAdjacent: "diagonal",
                };

                const result = executeMoveToAction(action, entity, 1);

                assert.strictEqual(
                    result.kind,
                    "complete",
                    `Should complete when diagonally adjacent at ${target.x}, ${target.y}`,
                );
            }
        });
    });

    describe("one-move-per-tick guard", () => {
        it("waits without stepping when it already moved this tick", () => {
            const root = new Entity("root");
            const entity = new Entity("entity");
            entity.setEcsComponent(createMovementStaminaComponent());
            entity.worldPosition = { x: 0, y: 0 };
            root.addChild(entity);

            // Simulate the entity having been advanced earlier this tick (e.g. via
            // a beneficial swap committed during another agent's turn).
            const stamina = entity.getEcsComponent("MovementStamina")!;
            recordMove(stamina, 5);

            const action: MoveToAction = {
                type: "moveTo",
                target: { x: 5, y: 0 },
            };

            const result = executeMoveToAction(action, entity, 5);

            assert.strictEqual(
                result.kind,
                "running",
                "Should wait (running) rather than step again this tick",
            );
            assert.deepStrictEqual(
                entity.worldPosition,
                { x: 0, y: 0 },
                "Should not have moved a second time this tick",
            );
        });
    });
});

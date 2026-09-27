import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { executeMoveToAction } from "../../../../src/game/behavior/actions/moveToAction.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/actionData.ts";
import {
    createMovementStaminaComponent,
    recordMove,
} from "../../../../src/game/component/movementStaminaComponent.ts";

type MoveToAction = Extract<BehaviorActionData, { type: "moveTo" }>;

describe("moveToAction", () => {
    describe("goal", () => {
        it("completes when standing on the target with an adjacent goal", () => {
            const root = new Entity("root");
            const entity = new Entity("entity");
            entity.worldPosition = { x: 5, y: 5 };
            root.addChild(entity);

            const action: MoveToAction = {
                type: "moveTo",
                target: { x: 5, y: 5 },
                goal: { kind: "adjacent" },
            };

            const result = executeMoveToAction(action, entity, 1);

            assert.strictEqual(result.kind, "complete");
        });

        it("does not complete when only diagonally adjacent", () => {
            const root = new Entity("root");
            const entity = new Entity("entity");
            entity.worldPosition = { x: 5, y: 5 };
            root.addChild(entity);

            const action: MoveToAction = {
                type: "moveTo",
                target: { x: 6, y: 6 }, // Diagonally adjacent
                goal: { kind: "adjacent" },
            };

            const result = executeMoveToAction(action, entity, 1);

            // Without pathfinding graph, movement will fail
            // The key assertion is that it doesn't complete just because diagonal
            assert.notStrictEqual(result.kind, "complete");
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

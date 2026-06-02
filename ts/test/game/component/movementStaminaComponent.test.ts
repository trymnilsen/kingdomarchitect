import assert from "node:assert";
import { describe, it } from "node:test";
import {
    createMovementStaminaComponent,
    hasMovedThisTick,
    recordMove,
} from "../../../src/game/component/movementStaminaComponent.ts";

describe("movementStaminaComponent", () => {
    describe("recordMove", () => {
        it("pushes a tick to the buffer", () => {
            const component = createMovementStaminaComponent();
            recordMove(component, 10);
            assert.deepStrictEqual(component.recentMoveTicks, [10]);
        });

        it("keeps multiple ticks in insertion order", () => {
            const component = createMovementStaminaComponent();
            recordMove(component, 10);
            recordMove(component, 12);
            recordMove(component, 15);
            assert.deepStrictEqual(component.recentMoveTicks, [10, 12, 15]);
        });

        it("drops the oldest entry when at capacity", () => {
            const component = createMovementStaminaComponent();
            for (let i = 1; i <= 6; i++) {
                recordMove(component, i);
            }
            // capacity is 5; first entry (1) should be gone
            assert.strictEqual(component.recentMoveTicks.length, 5);
            assert.strictEqual(component.recentMoveTicks[0], 2);
            assert.strictEqual(component.recentMoveTicks[4], 6);
        });

        it("newest entry is always the last element", () => {
            const component = createMovementStaminaComponent();
            recordMove(component, 5);
            recordMove(component, 20);
            const last =
                component.recentMoveTicks[component.recentMoveTicks.length - 1];
            assert.strictEqual(last, 20);
        });
    });

    describe("hasMovedThisTick", () => {
        it("returns false on an empty buffer", () => {
            const component = createMovementStaminaComponent();
            assert.strictEqual(hasMovedThisTick(component, 10), false);
        });

        it("returns true when the last entry matches the tick", () => {
            const component = createMovementStaminaComponent();
            recordMove(component, 10);
            assert.strictEqual(hasMovedThisTick(component, 10), true);
        });

        it("returns false when the last entry does not match the tick", () => {
            const component = createMovementStaminaComponent();
            recordMove(component, 9);
            assert.strictEqual(hasMovedThisTick(component, 10), false);
        });

        it("returns false when moves exist but none match the current tick", () => {
            const component = createMovementStaminaComponent();
            recordMove(component, 5);
            recordMove(component, 7);
            assert.strictEqual(hasMovedThisTick(component, 10), false);
        });
    });

});

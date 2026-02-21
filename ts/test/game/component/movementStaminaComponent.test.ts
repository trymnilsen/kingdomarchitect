import assert from "node:assert";
import { describe, it } from "node:test";
import {
    createMovementStaminaComponent,
    getMovementPressure,
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
            const last = component.recentMoveTicks[component.recentMoveTicks.length - 1];
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

    describe("getMovementPressure", () => {
        it("returns 0 when no moves recorded", () => {
            const component = createMovementStaminaComponent();
            assert.strictEqual(getMovementPressure(component, 20, 10), 0);
        });

        it("returns 0 when all moves are outside the window", () => {
            const component = createMovementStaminaComponent();
            recordMove(component, 1);
            recordMove(component, 2);
            // window is [currentTick - window, currentTick] = [11, 20]
            assert.strictEqual(getMovementPressure(component, 20, 10), 0);
        });

        it("returns correct fractional value for partial fill", () => {
            const component = createMovementStaminaComponent();
            // capacity = 5; put 2 moves inside the window
            recordMove(component, 15);
            recordMove(component, 18);
            // 2 / 5 = 0.4
            const pressure = getMovementPressure(component, 20, 10);
            assert.strictEqual(pressure, 0.4);
        });

        it("returns 1.0 when buffer is fully saturated within the window", () => {
            const component = createMovementStaminaComponent();
            recordMove(component, 16);
            recordMove(component, 17);
            recordMove(component, 18);
            recordMove(component, 19);
            recordMove(component, 20);
            assert.strictEqual(getMovementPressure(component, 20, 10), 1.0);
        });

        it("counts only entries within the window, ignores older ones", () => {
            const component = createMovementStaminaComponent();
            recordMove(component, 5);   // outside window [11,20]
            recordMove(component, 15);  // inside
            recordMove(component, 18);  // inside
            // 2 inside / 5 capacity = 0.4
            assert.strictEqual(getMovementPressure(component, 20, 10), 0.4);
        });
    });
});

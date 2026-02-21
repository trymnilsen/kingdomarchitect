import { describe, it } from "node:test";
import assert from "node:assert";
import {
    createWarmthComponent,
    increaseWarmth,
    decreaseWarmth,
    isWarm,
    isCold,
    COLD_THRESHOLD,
    DEFAULT_WARMTH,
} from "../../../src/game/component/warmthComponent.ts";

describe("WarmthComponent", () => {
    describe("createWarmthComponent", () => {
        it("creates component with default values", () => {
            const component = createWarmthComponent();
            assert.strictEqual(component.id, "Warmth");
            assert.strictEqual(component.warmth, DEFAULT_WARMTH);
            assert.strictEqual(component.decayRate, 1.0);
        });

        it("creates component with custom values", () => {
            const component = createWarmthComponent(50, 2.0);
            assert.strictEqual(component.warmth, 50);
            assert.strictEqual(component.decayRate, 2.0);
        });
    });

    describe("increaseWarmth", () => {
        it("increases warmth by specified amount", () => {
            const component = createWarmthComponent(50);
            increaseWarmth(component, 10);
            assert.strictEqual(component.warmth, 60);
        });

        it("clamps warmth to maximum of 100", () => {
            const component = createWarmthComponent(95);
            increaseWarmth(component, 10);
            assert.strictEqual(component.warmth, 100);
        });
    });

    describe("decreaseWarmth", () => {
        it("decreases warmth by specified amount", () => {
            const component = createWarmthComponent(50);
            decreaseWarmth(component, 10);
            assert.strictEqual(component.warmth, 40);
        });

        it("clamps warmth to minimum of 0", () => {
            const component = createWarmthComponent(5);
            decreaseWarmth(component, 10);
            assert.strictEqual(component.warmth, 0);
        });
    });

    describe("isWarm", () => {
        it("returns true when warmth is at the cold threshold", () => {
            const component = createWarmthComponent(COLD_THRESHOLD);
            assert.strictEqual(isWarm(component), true);
        });

        it("returns true when warmth is above the cold threshold", () => {
            const component = createWarmthComponent(COLD_THRESHOLD + 10);
            assert.strictEqual(isWarm(component), true);
        });

        it("returns false when warmth is below the cold threshold", () => {
            const component = createWarmthComponent(COLD_THRESHOLD - 1);
            assert.strictEqual(isWarm(component), false);
        });
    });

    describe("isCold", () => {
        it("returns true when warmth is below the cold threshold", () => {
            const component = createWarmthComponent(COLD_THRESHOLD - 1);
            assert.strictEqual(isCold(component), true);
        });

        it("returns false when warmth is at the cold threshold", () => {
            const component = createWarmthComponent(COLD_THRESHOLD);
            assert.strictEqual(isCold(component), false);
        });

        it("returns false when warmth is above the cold threshold", () => {
            const component = createWarmthComponent(COLD_THRESHOLD + 10);
            assert.strictEqual(isCold(component), false);
        });
    });
});

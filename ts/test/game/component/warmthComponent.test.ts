import { describe, it } from "node:test";
import assert from "node:assert";
import {
    createWarmthComponent,
    increaseWarmth,
    decreaseWarmth,
    isWarm,
    isCold,
} from "../../../src/game/component/warmthComponent.ts";

describe("WarmthComponent", () => {
    describe("createWarmthComponent", () => {
        it("creates component with default values", () => {
            const component = createWarmthComponent();
            assert.strictEqual(component.id, "Warmth");
            assert.strictEqual(component.warmth, 80);
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
        it("returns true when warmth >= 70", () => {
            const component = createWarmthComponent(70);
            assert.strictEqual(isWarm(component), true);
        });

        it("returns true when warmth > 70", () => {
            const component = createWarmthComponent(80);
            assert.strictEqual(isWarm(component), true);
        });

        it("returns false when warmth < 70", () => {
            const component = createWarmthComponent(69);
            assert.strictEqual(isWarm(component), false);
        });
    });

    describe("isCold", () => {
        it("returns true when warmth < 70", () => {
            const component = createWarmthComponent(69);
            assert.strictEqual(isCold(component), true);
        });

        it("returns false when warmth >= 70", () => {
            const component = createWarmthComponent(70);
            assert.strictEqual(isCold(component), false);
        });

        it("returns false when warmth > 70", () => {
            const component = createWarmthComponent(80);
            assert.strictEqual(isCold(component), false);
        });
    });
});

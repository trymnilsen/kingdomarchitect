import { describe, it } from "node:test";
import assert from "node:assert";
import { createSleepBehavior } from "../../../src/game/behavior/behaviors/SleepBehavior.ts";
import {
    createEntityWithEnergy,
    createBehaviorTestEntity,
} from "./behaviorTestHelpers.ts";

describe("SleepBehavior", () => {
    describe("isValid", () => {
        it("returns true when energy is below 30", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 29);

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, true);
        });

        it("returns false when energy is 30 or above", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 30);

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, false);
        });

        it("returns false when entity has no energy component", () => {
            const behavior = createSleepBehavior();
            const entity = createBehaviorTestEntity("test");

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, false);
        });
    });

    describe("utility", () => {
        it("returns 0 when energy is 30 or above", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 30);

            const utility = behavior.utility(entity);

            assert.strictEqual(utility, 0);
        });

        it("returns 60 when energy is exactly 29", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 29);

            const utility = behavior.utility(entity);

            assert.ok(utility >= 60 && utility < 61);
        });

        it("returns higher utility for lower energy", () => {
            const behavior = createSleepBehavior();
            const entity20 = createEntityWithEnergy("test", 20);
            const entity10 = createEntityWithEnergy("test", 10);

            const utility20 = behavior.utility(entity20);
            const utility10 = behavior.utility(entity10);

            assert.ok(utility10 > utility20);
        });

        it("returns approximately 80 when energy is 0", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 0);

            const utility = behavior.utility(entity);

            assert.ok(utility >= 79 && utility <= 81);
        });

        it("returns 0 when entity has no energy component", () => {
            const behavior = createSleepBehavior();
            const entity = createBehaviorTestEntity("test");

            const utility = behavior.utility(entity);

            assert.strictEqual(utility, 0);
        });
    });

    describe("expand", () => {
        it("returns sleep action", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 10);

            const actions = behavior.expand(entity);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].type, "sleep");
        });
    });

    describe("name", () => {
        it("has name 'sleep'", () => {
            const behavior = createSleepBehavior();

            assert.strictEqual(behavior.name, "sleep");
        });
    });
});

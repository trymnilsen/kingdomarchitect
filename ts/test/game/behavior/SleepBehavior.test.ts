import { describe, it } from "node:test";
import assert from "node:assert";
import { createSleepBehavior } from "../../../src/game/behavior/behaviors/SleepBehavior.ts";
import {
    createEntityWithEnergy,
    createBehaviorTestEntity,
} from "./behaviorTestHelpers.ts";
import { EnergyComponentId } from "../../../src/game/component/energyComponent.ts";

describe("SleepBehavior", () => {
    describe("isValid", () => {
        it("returns true when energy is below 30", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 29);

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, true);
        });

        it("returns false when energy is 30 or above and no exhaustion", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 30);

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, false);
        });

        it("returns true when exhaustionLevel > 0 even with energy >= 30", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 50);
            const energy = entity.requireEcsComponent(EnergyComponentId);
            energy.exhaustionLevel = 1;

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, true);
        });

        it("returns false when entity has no energy component", () => {
            const behavior = createSleepBehavior();
            const entity = createBehaviorTestEntity("test");

            const valid = behavior.isValid(entity);

            assert.strictEqual(valid, false);
        });
    });

    describe("utility", () => {
        it("returns 0 when energy is 30 or above and no exhaustion", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 30);

            const utility = behavior.utility(entity);

            assert.strictEqual(utility, 0);
        });

        it("returns ~56 when energy is exactly 29 (base formula)", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 29);

            const utility = behavior.utility(entity);

            // base = 55 + (30-29)*0.67 = 55.67
            assert.ok(utility >= 55 && utility < 57, `expected ~56, got ${utility}`);
        });

        it("returns ~75 when energy is 0 and no exhaustion", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 0);

            const utility = behavior.utility(entity);

            // base = 55 + 30*0.67 = 75.1
            assert.ok(utility >= 74 && utility <= 76, `expected ~75, got ${utility}`);
        });

        it("returns higher utility for lower energy", () => {
            const behavior = createSleepBehavior();
            const entity20 = createEntityWithEnergy("test", 20);
            const entity10 = createEntityWithEnergy("test", 10);

            const utility20 = behavior.utility(entity20);
            const utility10 = behavior.utility(entity10);

            assert.ok(utility10 > utility20);
        });

        it("utility at exhaustion level 3 is greater than at level 1 for same energy", () => {
            const behavior = createSleepBehavior();
            const entity1 = createEntityWithEnergy("test", 20);
            const entity3 = createEntityWithEnergy("test", 20);

            entity1.requireEcsComponent(EnergyComponentId).exhaustionLevel = 1;
            entity3.requireEcsComponent(EnergyComponentId).exhaustionLevel = 3;

            assert.ok(behavior.utility(entity3) > behavior.utility(entity1));
        });

        it("returns 0 when entity has no energy component", () => {
            const behavior = createSleepBehavior();
            const entity = createBehaviorTestEntity("test");

            const utility = behavior.utility(entity);

            assert.strictEqual(utility, 0);
        });
    });

    describe("expand", () => {
        it("returns sleep action with energyPerTick and energyTarget", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 10);

            const actions = behavior.expand(entity);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].type, "sleep");
            if (actions[0].type === "sleep") {
                assert.ok(actions[0].energyPerTick > 0);
                assert.ok(actions[0].energyTarget > 0);
            }
        });

        it("returns collapse action at exhaustion level 4", () => {
            const behavior = createSleepBehavior();
            const entity = createEntityWithEnergy("test", 0);
            entity.requireEcsComponent(EnergyComponentId).exhaustionLevel = 4;

            const actions = behavior.expand(entity);

            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].type, "sleep");
            if (actions[0].type === "sleep") {
                assert.strictEqual(actions[0].quality, "collapse");
            }
        });
    });

    describe("name", () => {
        it("has name 'sleep'", () => {
            const behavior = createSleepBehavior();

            assert.strictEqual(behavior.name, "sleep");
        });
    });
});

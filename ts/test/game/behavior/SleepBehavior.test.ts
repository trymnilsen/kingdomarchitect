import { describe, it } from "node:test";
import assert from "node:assert";
import {
    createSleepBehavior,
    SLEEP_THRESHOLD_FRACTION,
    SLEEP_UTILITY_BASE,
    SLEEP_UTILITY_RANGE,
} from "../../../src/game/behavior/behaviors/SleepBehavior.ts";
import {
    createEntityWithEnergy,
    createBehaviorTestEntity,
} from "./behaviorTestHelpers.ts";
import { EnergyComponentId } from "../../../src/game/component/energyComponent.ts";

/**
 * Pool sizes the fraction-based rules are checked against. Two differently sized
 * pools is the whole point: any rule that reads an absolute point count instead
 * of a fraction diverges between them.
 */
const POOL_SIZES = [100, 300];

function entityAtFraction(fraction: number, maxEnergy: number) {
    return createEntityWithEnergy("test", fraction * maxEnergy, maxEnergy);
}

describe("SleepBehavior", () => {
    describe("isValid", () => {
        it("returns true below the sleep threshold fraction", () => {
            const behavior = createSleepBehavior();

            for (const maxEnergy of POOL_SIZES) {
                const entity = entityAtFraction(
                    SLEEP_THRESHOLD_FRACTION - 0.01,
                    maxEnergy,
                );

                assert.strictEqual(
                    behavior.isValid(entity),
                    true,
                    `should want sleep just under the threshold at maxEnergy ${maxEnergy}`,
                );
            }
        });

        it("returns false at the sleep threshold fraction with no exhaustion", () => {
            const behavior = createSleepBehavior();

            for (const maxEnergy of POOL_SIZES) {
                const entity = entityAtFraction(
                    SLEEP_THRESHOLD_FRACTION,
                    maxEnergy,
                );

                assert.strictEqual(
                    behavior.isValid(entity),
                    false,
                    `should not want sleep at the threshold at maxEnergy ${maxEnergy}`,
                );
            }
        });

        it("returns true when exhausted even above the threshold fraction", () => {
            const behavior = createSleepBehavior();
            const entity = entityAtFraction(0.5, 300);
            entity.requireEcsComponent(EnergyComponentId).exhaustionLevel = 1;

            assert.strictEqual(behavior.isValid(entity), true);
        });

        it("returns false when entity has no energy component", () => {
            const behavior = createSleepBehavior();
            const entity = createBehaviorTestEntity("test");

            assert.strictEqual(behavior.isValid(entity), false);
        });
    });

    describe("utility", () => {
        it("returns 0 at and above the threshold fraction", () => {
            const behavior = createSleepBehavior();

            for (const fraction of [SLEEP_THRESHOLD_FRACTION, 0.6, 1.0]) {
                const entity = entityAtFraction(fraction, 300);

                assert.strictEqual(
                    behavior.utility(entity),
                    0,
                    `expected no urgency at fraction ${fraction}`,
                );
            }
        });

        it("ramps from the base at the threshold to base plus range at empty", () => {
            const behavior = createSleepBehavior();

            // Just under the threshold the ramp has barely started, so utility
            // sits at the base; at empty it has travelled the full range.
            const barelyTired = entityAtFraction(
                SLEEP_THRESHOLD_FRACTION - 0.0001,
                300,
            );
            const empty = entityAtFraction(0, 300);

            assert.ok(
                Math.abs(behavior.utility(barelyTired) - SLEEP_UTILITY_BASE) <
                    0.1,
                `expected ~${SLEEP_UTILITY_BASE}, got ${behavior.utility(barelyTired)}`,
            );
            assert.strictEqual(
                behavior.utility(empty),
                SLEEP_UTILITY_BASE + SLEEP_UTILITY_RANGE,
            );
        });

        it("rises strictly as energy falls", () => {
            const behavior = createSleepBehavior();
            const fractions = [0.29, 0.2, 0.1, 0.0];

            let previous = 0;
            for (const fraction of fractions) {
                const utility = behavior.utility(
                    entityAtFraction(fraction, 300),
                );
                assert.ok(
                    utility > previous,
                    `utility should rise as energy falls, but fraction ${fraction} gave ${utility} after ${previous}`,
                );
                previous = utility;
            }
        });

        it("returns the same utility for the same fraction across pool sizes", () => {
            const behavior = createSleepBehavior();

            for (const fraction of [0, 0.1, 0.2, 0.29]) {
                const [small, large] = POOL_SIZES.map((maxEnergy) =>
                    behavior.utility(entityAtFraction(fraction, maxEnergy)),
                );

                assert.strictEqual(
                    small,
                    large,
                    `fraction ${fraction} scored ${small} at maxEnergy ${POOL_SIZES[0]} but ${large} at ${POOL_SIZES[1]}`,
                );
            }
        });

        it("scores higher at the same energy when exhaustion is worse", () => {
            const behavior = createSleepBehavior();
            const entity1 = entityAtFraction(0.2, 300);
            const entity3 = entityAtFraction(0.2, 300);

            entity1.requireEcsComponent(EnergyComponentId).exhaustionLevel = 1;
            entity3.requireEcsComponent(EnergyComponentId).exhaustionLevel = 3;

            assert.ok(behavior.utility(entity3) > behavior.utility(entity1));
        });

        it("returns 0 when entity has no energy component", () => {
            const behavior = createSleepBehavior();
            const entity = createBehaviorTestEntity("test");

            assert.strictEqual(behavior.utility(entity), 0);
        });
    });

    describe("expand", () => {
        it("scales the sleep action to the entity's own pool", () => {
            const behavior = createSleepBehavior();

            const [small, large] = POOL_SIZES.map((maxEnergy) => {
                const actions = behavior.expand(
                    entityAtFraction(0.1, maxEnergy),
                );
                assert.strictEqual(actions.length, 1);
                assert.strictEqual(actions[0].type, "sleep");
                return actions[0];
            });

            if (small.type !== "sleep" || large.type !== "sleep") {
                throw new Error("expected sleep actions");
            }
            // A three times larger pool must restore three times as fast and
            // three times as far, so the sleep still takes the same wall time.
            assert.strictEqual(large.energyPerTick, small.energyPerTick * 3);
            assert.strictEqual(large.energyTarget, small.energyTarget * 3);
        });

        it("returns collapse action at exhaustion level 4", () => {
            const behavior = createSleepBehavior();
            const entity = entityAtFraction(0, 300);
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

import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createEnergyComponent,
    EnergyComponentId,
} from "../../../../src/game/component/energyComponent.ts";
import {
    createBehaviorAgentComponent,
    BehaviorAgentComponentId,
} from "../../../../src/game/component/BehaviorAgentComponent.ts";
import {
    executeSleepAction,
    resolveSleepEnergyPerTick,
    resolveSleepEnergyTarget,
    type SleepActionData,
} from "../../../../src/game/behavior/actions/sleepAction.ts";
import type { SleepQuality } from "../../../../src/game/behavior/actions/Action.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../../src/game/component/healthComponent.ts";

function createSleeper(energy: number = 0, maxEnergy: number = 100): Entity {
    const root = new Entity("root");
    const worker = new Entity("worker");
    worker.worldPosition = { x: 12, y: 8 };
    const energyComp = createEnergyComponent(maxEnergy);
    energyComp.energy = energy;
    worker.setEcsComponent(energyComp);
    worker.setEcsComponent(createBehaviorAgentComponent());
    root.addChild(worker);
    return worker;
}

function makeSleepAction(
    energyPerTick: number,
    energyTarget: number,
    quality: SleepActionData["quality"] = "house",
): SleepActionData {
    return { type: "sleep", quality, energyPerTick, energyTarget };
}

describe("executeSleepAction", () => {
    it("increments energy by energyPerTick each tick", () => {
        const worker = createSleeper(20);
        const action = makeSleepAction(10, 100);

        executeSleepAction(action, worker);

        const energy = worker.requireEcsComponent(EnergyComponentId);
        assert.strictEqual(energy.energy, 30);
    });

    it("returns running while energy is below target", () => {
        const worker = createSleeper(20);
        const action = makeSleepAction(10, 100);

        const result = executeSleepAction(action, worker);

        assert.strictEqual(result.kind, "running");
    });

    it("returns complete when energy reaches target", () => {
        const worker = createSleeper(90);
        const action = makeSleepAction(10, 100);

        const result = executeSleepAction(action, worker);

        assert.strictEqual(result.kind, "complete");
    });

    it("clamps energy to energyTarget on completion, not beyond", () => {
        const worker = createSleeper(95);
        const action = makeSleepAction(10, 100);

        executeSleepAction(action, worker);

        const energy = worker.requireEcsComponent(EnergyComponentId);
        assert.strictEqual(energy.energy, 100);
    });

    it("clears exhaustion on completion", () => {
        const worker = createSleeper(90);
        const energy = worker.requireEcsComponent(EnergyComponentId);
        energy.exhaustionLevel = 2;
        const action = makeSleepAction(10, 100, "house");

        executeSleepAction(action, worker);

        assert.strictEqual(energy.exhaustionLevel, 0);
    });

    it("does not clear exhaustion while still sleeping", () => {
        const worker = createSleeper(20);
        const energy = worker.requireEcsComponent(EnergyComponentId);
        energy.exhaustionLevel = 2;
        const action = makeSleepAction(10, 100, "house");

        executeSleepAction(action, worker);

        assert.strictEqual(energy.exhaustionLevel, 2);
    });

    it("collapse quality clears exhaustion to level 2 on completion", () => {
        const worker = createSleeper(28);
        const energy = worker.requireEcsComponent(EnergyComponentId);
        energy.exhaustionLevel = 4;
        const action = makeSleepAction(2, 30, "collapse");

        executeSleepAction(action, worker);

        assert.strictEqual(energy.exhaustionLevel, 2);
    });

    it("invalidates energy component each tick", () => {
        const root = new Entity("root");
        const worker = new Entity("worker");
        worker.worldPosition = { x: 12, y: 8 };
        const energyComp = createEnergyComponent(100);
        energyComp.energy = 20;
        worker.setEcsComponent(energyComp);
        worker.setEcsComponent(createBehaviorAgentComponent());
        root.addChild(worker);

        let invalidated = false;
        root.entityEvent = (event) => {
            if (
                event.id === "component_updated" &&
                event.item.id === EnergyComponentId
            ) {
                invalidated = true;
            }
        };

        executeSleepAction(makeSleepAction(10, 100), worker);

        assert.strictEqual(invalidated, true);
    });
});

describe("sleep energy resolution", () => {
    const QUALITIES: SleepQuality[] = [
        "house",
        "bedrollFire",
        "bedrollAlone",
        "collapse",
    ];
    const SMALL_POOL = 100;
    const LARGE_POOL = 300;
    const POOL_RATIO = LARGE_POOL / SMALL_POOL;

    /** Sleep from empty to completion, returning how many ticks it took. */
    function ticksToWake(quality: SleepQuality, maxEnergy: number): number {
        const worker = createSleeper(0, maxEnergy);
        const action: SleepActionData = {
            type: "sleep",
            quality,
            energyPerTick: resolveSleepEnergyPerTick(quality, maxEnergy, 1.0),
            energyTarget: resolveSleepEnergyTarget(quality, maxEnergy),
        };

        let ticks = 0;
        while (executeSleepAction(action, worker).kind === "running") {
            ticks++;
            assert.ok(ticks < 1000, `${quality} sleep never completed`);
        }
        return ticks + 1;
    }

    it("keeps sleep duration constant when the energy pool is retuned", () => {
        // The regression guard for the fraction conversion: if the restore rate
        // were still an absolute point count, tripling the pool would triple
        // every sleep, and with it the total HP healed per sleep.
        for (const quality of QUALITIES) {
            assert.strictEqual(
                ticksToWake(quality, LARGE_POOL),
                ticksToWake(quality, SMALL_POOL),
                `${quality} sleep changed duration between pool sizes`,
            );
        }
    });

    it("restores energy at a rate proportional to the pool", () => {
        for (const quality of QUALITIES) {
            assert.strictEqual(
                resolveSleepEnergyPerTick(quality, LARGE_POOL, 1.0),
                resolveSleepEnergyPerTick(quality, SMALL_POOL, 1.0) *
                    POOL_RATIO,
                `${quality} restore rate did not scale with the pool`,
            );
        }
    });

    it("always restores something, so sleep cannot wedge on a small pool", () => {
        // The restore rate is a floored fraction, which rounds to zero once the
        // pool is small enough. A zero rate leaves the sleeper permanently short
        // of its target and the action never completes.
        for (const maxEnergy of [10, 20, 50, SMALL_POOL, LARGE_POOL]) {
            for (const quality of QUALITIES) {
                assert.ok(
                    resolveSleepEnergyPerTick(quality, maxEnergy, 1.0) > 0,
                    `${quality} restores nothing per tick at maxEnergy ${maxEnergy}`,
                );
                // Throws rather than hanging if the action never completes.
                ticksToWake(quality, maxEnergy);
            }
        }
    });

    it("slows sleep by the entity's sleep multiplier", () => {
        assert.strictEqual(
            resolveSleepEnergyPerTick("house", LARGE_POOL, 2.0),
            resolveSleepEnergyPerTick("house", LARGE_POOL, 1.0) / 2,
        );
    });
});

describe("executeSleepAction healing", () => {
    function createWoundedSleeper(
        currentHp: number,
        maxHp: number = 200,
    ): Entity {
        const worker = createSleeper(20);
        worker.setEcsComponent(createHealthComponent(currentHp, maxHp));
        return worker;
    }

    it("house quality heals 4 hp per tick", () => {
        const worker = createWoundedSleeper(100);
        const action = makeSleepAction(10, 100, "house");

        executeSleepAction(action, worker);

        const health = worker.requireEcsComponent(HealthComponentId);
        assert.strictEqual(health.currentHp, 104);
    });

    it("bedrollFire quality accumulates fractional heals to 5 hp over 2 ticks", () => {
        const worker = createWoundedSleeper(100);
        const action = makeSleepAction(8, 80, "bedrollFire");

        executeSleepAction(action, worker);
        const health = worker.requireEcsComponent(HealthComponentId);
        assert.strictEqual(health.currentHp, 102);
        assert.strictEqual(action.healAccumulator, 0.5);

        executeSleepAction(action, worker);
        assert.strictEqual(health.currentHp, 105);
        assert.strictEqual(action.healAccumulator, 0);
    });

    it("collapse quality heals 1 hp over 2 ticks instead of rounding to zero", () => {
        const worker = createWoundedSleeper(100);
        const action = makeSleepAction(2, 30, "collapse");

        executeSleepAction(action, worker);
        const health = worker.requireEcsComponent(HealthComponentId);
        assert.strictEqual(health.currentHp, 100);
        assert.strictEqual(action.healAccumulator, 0.5);

        executeSleepAction(action, worker);
        assert.strictEqual(health.currentHp, 101);
    });

    it("does not heal past maxHp", () => {
        const worker = createWoundedSleeper(199);
        const action = makeSleepAction(10, 100, "house");

        executeSleepAction(action, worker);

        const health = worker.requireEcsComponent(HealthComponentId);
        assert.strictEqual(health.currentHp, 200);
    });

    it("runs without a health component", () => {
        const worker = createSleeper(20);
        const action = makeSleepAction(10, 100, "house");

        const result = executeSleepAction(action, worker);

        assert.strictEqual(result.kind, "running");
    });

    it("invalidates the health component when whole hp lands", () => {
        const worker = createWoundedSleeper(100);
        const root = worker.getRootEntity();

        let invalidated = false;
        root.entityEvent = (event) => {
            if (
                event.id === "component_updated" &&
                event.item.id === HealthComponentId
            ) {
                invalidated = true;
            }
        };

        executeSleepAction(makeSleepAction(10, 100, "house"), worker);

        assert.strictEqual(invalidated, true);
    });
});

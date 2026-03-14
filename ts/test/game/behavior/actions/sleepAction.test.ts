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
    type SleepActionData,
} from "../../../../src/game/behavior/actions/sleepAction.ts";

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

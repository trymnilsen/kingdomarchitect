import { describe, it } from "node:test";
import assert from "node:assert";
import {
    createEnergyComponent,
    spendEnergy,
    addExhaustionDebt,
    clearExhaustion,
    spendEntityEnergy,
    clearEntityExhaustion,
    EnergyComponentId,
} from "../../../src/game/component/energyComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createActiveEffectsComponent, ActiveEffectsComponentId } from "../../../src/game/component/activeEffectsComponent.ts";

function makeEntityWithEnergy(energy: number = 100, maxEnergy: number = 100): Entity {
    const entity = new Entity("test-energy");
    entity.worldPosition = { x: 5, y: 5 };
    const comp = createEnergyComponent(maxEnergy);
    comp.energy = energy;
    entity.setEcsComponent(comp);
    entity.setEcsComponent(createActiveEffectsComponent());
    return entity;
}

describe("EnergyComponent", () => {
    describe("createEnergyComponent", () => {
        it("defaults to full energy", () => {
            const comp = createEnergyComponent(100);
            assert.strictEqual(comp.energy, 100);
            assert.strictEqual(comp.maxEnergy, 100);
            assert.strictEqual(comp.exhaustionLevel, 0);
            assert.strictEqual(comp.exhaustionDebt, 0);
        });
    });

    describe("spendEnergy", () => {
        it("returns 0 when entity has sufficient energy", () => {
            const comp = createEnergyComponent(100);
            const overspend = spendEnergy(comp, 10);
            assert.strictEqual(overspend, 0);
            assert.strictEqual(comp.energy, 90);
        });

        it("returns overspend amount and clamps energy to 0 when insufficient", () => {
            const comp = createEnergyComponent(100);
            comp.energy = 3;
            const overspend = spendEnergy(comp, 5);
            assert.strictEqual(overspend, 2);
            assert.strictEqual(comp.energy, 0);
        });

        it("returns exact cost as overspend when energy is already 0", () => {
            const comp = createEnergyComponent(100);
            comp.energy = 0;
            const overspend = spendEnergy(comp, 5);
            assert.strictEqual(overspend, 5);
            assert.strictEqual(comp.energy, 0);
        });
    });

    describe("addExhaustionDebt", () => {
        it("accumulates debt without changing level when below threshold", () => {
            const comp = createEnergyComponent(100);
            const raised = addExhaustionDebt(comp, 5);
            assert.strictEqual(raised, false);
            assert.strictEqual(comp.exhaustionLevel, 0);
            assert.strictEqual(comp.exhaustionDebt, 5);
        });

        it("increases exhaustion level and resets debt when threshold crossed", () => {
            const comp = createEnergyComponent(100);
            // threshold default is 15
            const raised = addExhaustionDebt(comp, 15);
            assert.strictEqual(raised, true);
            assert.strictEqual(comp.exhaustionLevel, 1);
            assert.strictEqual(comp.exhaustionDebt, 0);
        });

        it("caps exhaustion level at 4", () => {
            const comp = createEnergyComponent(100);
            comp.exhaustionLevel = 4;
            addExhaustionDebt(comp, 100);
            assert.strictEqual(comp.exhaustionLevel, 4);
        });

        it("does not cross multiple levels in a single call (only one level at a time)", () => {
            const comp = createEnergyComponent(100);
            // Large amount still only raises one level
            addExhaustionDebt(comp, 50);
            assert.strictEqual(comp.exhaustionLevel, 1);
        });
    });

    describe("clearExhaustion", () => {
        it("sets exhaustion level and zeroes debt", () => {
            const comp = createEnergyComponent(100);
            comp.exhaustionLevel = 3;
            comp.exhaustionDebt = 10;

            clearExhaustion(comp, 1);

            assert.strictEqual(comp.exhaustionLevel, 1);
            assert.strictEqual(comp.exhaustionDebt, 0);
        });

        it("clamps level to 0 minimum", () => {
            const comp = createEnergyComponent(100);
            clearExhaustion(comp, -5);
            assert.strictEqual(comp.exhaustionLevel, 0);
        });

        it("clamps level to 4 maximum", () => {
            const comp = createEnergyComponent(100);
            clearExhaustion(comp, 10);
            assert.strictEqual(comp.exhaustionLevel, 4);
        });
    });

    describe("spendEntityEnergy", () => {
        it("reduces entity energy by cost", () => {
            const entity = makeEntityWithEnergy(50);
            spendEntityEnergy(entity, 10);
            const comp = entity.requireEcsComponent(EnergyComponentId);
            assert.strictEqual(comp.energy, 40);
        });

        it("adds exhaustion effect when exhaustion level goes from 0 to 1", () => {
            const entity = makeEntityWithEnergy(0);
            const comp = entity.requireEcsComponent(EnergyComponentId);
            comp.exhaustionDebtThreshold = 5;

            // Spend more than we have — will trigger overspend → debt → level up
            spendEntityEnergy(entity, 5);

            const effectsComp = entity.requireEcsComponent(ActiveEffectsComponentId);
            const hasExhaustionEffect = effectsComp.effects.some(
                (e) => e.effect.id === "exhaustion",
            );
            assert.strictEqual(comp.exhaustionLevel, 1);
            assert.ok(hasExhaustionEffect, "exhaustion effect should be added");
        });

        it("does not duplicate exhaustion effect when already at level > 0", () => {
            const entity = makeEntityWithEnergy(0);
            const comp = entity.requireEcsComponent(EnergyComponentId);
            comp.exhaustionLevel = 2;
            // Manually add effect to simulate pre-existing state
            const effectsComp = entity.requireEcsComponent(ActiveEffectsComponentId);
            effectsComp.effects.push({
                effect: { id: "exhaustion", timing: { type: "persistent" }, data: {}, name: "Exhaustion", sprite: "empty_sprite" },
                source: "exhaustion",
                modifiers: {},
                state: {},
                remainingTicks: 0,
                ticksSinceLastApplication: 0,
            });

            spendEntityEnergy(entity, 1); // debt, but level stays >= 1 so no new effect

            assert.strictEqual(effectsComp.effects.length, 1, "should not duplicate effect");
        });

        it("no-ops if entity has no EnergyComponent", () => {
            const entity = new Entity("no-energy");
            // Should not throw
            spendEntityEnergy(entity, 10);
        });
    });

    describe("clearEntityExhaustion", () => {
        it("removes exhaustion effect when level reaches 0", () => {
            const entity = makeEntityWithEnergy(50);
            const comp = entity.requireEcsComponent(EnergyComponentId);
            comp.exhaustionLevel = 1;
            const effectsComp = entity.requireEcsComponent(ActiveEffectsComponentId);
            effectsComp.effects.push({
                effect: { id: "exhaustion", timing: { type: "persistent" }, data: {}, name: "Exhaustion", sprite: "empty_sprite" },
                source: "exhaustion",
                modifiers: {},
                state: {},
                remainingTicks: 0,
                ticksSinceLastApplication: 0,
            });

            clearEntityExhaustion(entity, 0);

            assert.strictEqual(comp.exhaustionLevel, 0);
            assert.strictEqual(effectsComp.effects.length, 0, "exhaustion effect should be removed");
        });

        it("keeps exhaustion effect when level stays above 0", () => {
            const entity = makeEntityWithEnergy(50);
            const comp = entity.requireEcsComponent(EnergyComponentId);
            comp.exhaustionLevel = 3;
            const effectsComp = entity.requireEcsComponent(ActiveEffectsComponentId);
            effectsComp.effects.push({
                effect: { id: "exhaustion", timing: { type: "persistent" }, data: {}, name: "Exhaustion", sprite: "empty_sprite" },
                source: "exhaustion",
                modifiers: {},
                state: {},
                remainingTicks: 0,
                ticksSinceLastApplication: 0,
            });

            clearEntityExhaustion(entity, 1);

            assert.strictEqual(comp.exhaustionLevel, 1);
            assert.strictEqual(effectsComp.effects.length, 1, "exhaustion effect should remain");
        });
    });
});

import { describe, it } from "node:test";
import assert from "node:assert";
import {
    createEnergyComponent,
    spendEnergy,
    addExhaustionDebt,
    spendEntityEnergy,
    clearEntityExhaustion,
    EnergyComponentId,
} from "../../../src/game/component/energyComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    createActiveEffectsComponent,
    ActiveEffectsComponentId,
} from "../../../src/game/component/activeEffectsComponent.ts";

function makeEntityWithEnergy(
    energy: number = 100,
    maxEnergy: number = 100,
): Entity {
    const entity = new Entity("test-energy");
    entity.worldPosition = { x: 5, y: 5 };
    const comp = createEnergyComponent(maxEnergy);
    comp.energy = energy;
    entity.setEcsComponent(comp);
    entity.setEcsComponent(createActiveEffectsComponent());
    return entity;
}

/**
 * Puts an exhaustion effect on the entity by hand, standing in for one an
 * earlier tick would have applied.
 */
function addExistingExhaustionEffect(entity: Entity): void {
    const effectsComp = entity.requireEcsComponent(ActiveEffectsComponentId);
    effectsComp.effects.push({
        effect: {
            id: "exhaustion",
            timing: { type: "persistent" },
            data: {},
            name: "Exhaustion",
            sprite: "empty_sprite",
        },
        source: "exhaustion",
        modifiers: {},
        state: {},
        remainingTicks: 0,
        ticksSinceLastApplication: 0,
    });
}

describe("EnergyComponent", () => {
    describe("spendEnergy", () => {
        it("returns overspend amount and clamps energy to 0 when insufficient", () => {
            const comp = createEnergyComponent(100);
            comp.energy = 3;
            const overspend = spendEnergy(comp, 5);
            assert.strictEqual(overspend, 2);
            assert.strictEqual(comp.energy, 0);
        });
    });

    describe("addExhaustionDebt", () => {
        it("increases exhaustion level and resets debt when threshold crossed", () => {
            const comp = createEnergyComponent(100);
            comp.exhaustionDebtThreshold = 10;

            const raised = addExhaustionDebt(comp, 10);

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

    describe("spendEntityEnergy", () => {
        it("adds exhaustion effect when exhaustion level goes from 0 to 1", () => {
            const entity = makeEntityWithEnergy(0);
            const comp = entity.requireEcsComponent(EnergyComponentId);
            comp.exhaustionDebtThreshold = 5;

            // Spend more than we have, which triggers overspend → debt → level up
            spendEntityEnergy(entity, 5);

            const effectsComp = entity.requireEcsComponent(
                ActiveEffectsComponentId,
            );
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
            addExistingExhaustionEffect(entity);
            const effectsComp = entity.requireEcsComponent(
                ActiveEffectsComponentId,
            );

            spendEntityEnergy(entity, 1); // debt, but level stays >= 1 so no new effect

            assert.strictEqual(
                effectsComp.effects.length,
                1,
                "should not duplicate effect",
            );
        });
    });

    describe("clearEntityExhaustion", () => {
        it("removes exhaustion effect when level reaches 0", () => {
            const entity = makeEntityWithEnergy(50);
            const comp = entity.requireEcsComponent(EnergyComponentId);
            comp.exhaustionLevel = 1;
            addExistingExhaustionEffect(entity);
            const effectsComp = entity.requireEcsComponent(
                ActiveEffectsComponentId,
            );

            clearEntityExhaustion(entity, 0);

            assert.strictEqual(comp.exhaustionLevel, 0);
            assert.strictEqual(
                effectsComp.effects.length,
                0,
                "exhaustion effect should be removed",
            );
        });
    });
});

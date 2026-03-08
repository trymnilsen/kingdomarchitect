import { describe, it } from "node:test";
import assert from "node:assert";
import {
    exhaustionEffectId,
    exhaustionEffect,
    exhaustionEffectExecutor,
} from "../../../../src/data/effect/exhaustion/exhaustionEffect.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createEnergyComponent,
    EnergyComponentId,
} from "../../../../src/game/component/energyComponent.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../../src/game/component/healthComponent.ts";
import {
    createActiveEffectsComponent,
    ActiveEffectsComponentId,
} from "../../../../src/game/component/activeEffectsComponent.ts";
import {
    createStatsComponent,
    StatsComponentId,
} from "../../../../src/game/component/statsComponent.ts";
import { getStats } from "../../../../src/game/stat/getStats.ts";
import type { ActiveEffect } from "../../../../src/game/component/activeEffectsComponent.ts";

function makeTestEntity(exhaustionLevel: number): {
    entity: Entity;
    activeEffect: ActiveEffect;
} {
    const entity = new Entity("test");
    entity.worldPosition = { x: 5, y: 5 };

    const energy = createEnergyComponent(100);
    energy.exhaustionLevel = exhaustionLevel;
    entity.setEcsComponent(energy);

    entity.setEcsComponent(createHealthComponent(50, 50));
    entity.setEcsComponent(createActiveEffectsComponent());
    entity.setEcsComponent(createStatsComponent());

    const activeEffect: ActiveEffect = {
        effect: exhaustionEffect,
        source: "exhaustion",
        modifiers: {},
        state: {},
        remainingTicks: 0,
        ticksSinceLastApplication: 0,
    };

    return { entity, activeEffect };
}

describe("exhaustionEffect", () => {
    it("effect id is 'exhaustion'", () => {
        assert.strictEqual(exhaustionEffectId, "exhaustion");
    });

    it("effect timing is persistent", () => {
        assert.strictEqual(exhaustionEffect.timing.type, "persistent");
    });

    describe("executor sets correct modifiers for exhaustion levels", () => {
        it("level 1 — sets might -15% and wit -1 flat", () => {
            const { entity, activeEffect } = makeTestEntity(1);
            exhaustionEffectExecutor.execute(entity, activeEffect, 1);
            assert.deepStrictEqual(activeEffect.modifiers, {
                might: { percent: -0.15 },
                wit: { flat: -1 },
            });
        });

        it("level 2 — sets might -30%, wit -20% flat -1, presence -1", () => {
            const { entity, activeEffect } = makeTestEntity(2);
            exhaustionEffectExecutor.execute(entity, activeEffect, 1);
            assert.deepStrictEqual(activeEffect.modifiers, {
                might: { percent: -0.3 },
                wit: { percent: -0.2, flat: -1 },
                presence: { flat: -1 },
            });
        });

        it("level 3 — sets severe penalties across all four stats", () => {
            const { entity, activeEffect } = makeTestEntity(3);
            exhaustionEffectExecutor.execute(entity, activeEffect, 1);
            assert.deepStrictEqual(activeEffect.modifiers, {
                might: { percent: -0.5 },
                wit: { percent: -0.4, flat: -2 },
                presence: { flat: -2 },
                valor: { flat: -1 },
            });
        });

        it("level 4 — sets maximum penalties", () => {
            const { entity, activeEffect } = makeTestEntity(4);
            exhaustionEffectExecutor.execute(entity, activeEffect, 1);
            assert.deepStrictEqual(activeEffect.modifiers, {
                might: { percent: -0.6 },
                wit: { percent: -0.5, flat: -3 },
                presence: { flat: -3 },
                valor: { flat: -2 },
            });
        });
    });

    describe("HP damage at level 4", () => {
        it("deals 5 HP damage every 10 ticks at level 4", () => {
            const { entity, activeEffect } = makeTestEntity(4);
            const health = entity.requireEcsComponent(HealthComponentId);

            for (let i = 0; i < 9; i++) {
                exhaustionEffectExecutor.execute(entity, activeEffect, i + 1);
            }
            // After 9 ticks: no damage yet
            assert.strictEqual(health.currentHp, 50);

            exhaustionEffectExecutor.execute(entity, activeEffect, 10);
            // After 10 ticks: 5 damage dealt
            assert.strictEqual(health.currentHp, 45);

            // Another 10 ticks
            for (let i = 0; i < 10; i++) {
                exhaustionEffectExecutor.execute(entity, activeEffect, 11 + i);
            }
            assert.strictEqual(health.currentHp, 40);
        });

        it("does not deal HP damage at levels 1, 2, 3", () => {
            for (const level of [1, 2, 3]) {
                const { entity, activeEffect } = makeTestEntity(level);
                const health = entity.requireEcsComponent(HealthComponentId);

                for (let i = 0; i < 20; i++) {
                    exhaustionEffectExecutor.execute(entity, activeEffect, i + 1);
                }

                assert.strictEqual(
                    health.currentHp,
                    50,
                    `Level ${level} should not deal HP damage`,
                );
            }
        });
    });

    describe("stat resolution via getStats", () => {
        it("getStats reflects exhaustion level 1 might penalty (-15%)", () => {
            const { entity, activeEffect } = makeTestEntity(1);
            const stats = entity.requireEcsComponent(StatsComponentId);
            stats.baseStats.might = 10;
            stats.cache.might = 10;

            exhaustionEffectExecutor.execute(entity, activeEffect, 1);

            // Add the effect to the entity's ActiveEffectsComponent
            const effectsComp = entity.requireEcsComponent(ActiveEffectsComponentId);
            effectsComp.effects.push(activeEffect);

            const resolved = getStats(entity);
            // base 10, -15% = 10 * 0.85 = 8.5 → floor → 8
            assert.strictEqual(resolved.might, 8);
        });
    });
});

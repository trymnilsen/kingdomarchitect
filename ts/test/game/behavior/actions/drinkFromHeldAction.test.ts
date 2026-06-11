import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
import {
    createActiveEffectsComponent,
    ActiveEffectsComponentId,
} from "../../../../src/game/component/activeEffectsComponent.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../../src/game/component/healthComponent.ts";
import { executeDrinkFromHeldAction } from "../../../../src/game/behavior/actions/drinkFromHeldAction.ts";
import { createEffectSystem } from "../../../../src/game/system/effectSystem.ts";
import { createEffectExecutorMap } from "../../../../src/data/effect/effectExecutorRegistry.ts";
import {
    breadItem,
    greaterHealthPotion,
    healthPotion,
} from "../../../../src/data/inventory/items/resources.ts";

function createDrinker(): { root: Entity; worker: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    worker.worldPosition = { x: 12, y: 8 };
    worker.setEcsComponent(createHeldItemComponent());
    worker.setEcsComponent(createActiveEffectsComponent());
    worker.setEcsComponent(createHealthComponent(100, 200));
    root.addChild(worker);
    return { root, worker };
}

describe("drinkFromHeldAction", () => {
    it("adds a heal effect of 50 when drinking a health potion", () => {
        const { worker } = createDrinker();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = healthPotion;
        held.amount = 1;

        const result = executeDrinkFromHeldAction(
            { type: "drinkFromHeld" },
            worker,
        );
        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(held.item, null);
        assert.strictEqual(held.amount, 0);

        const effects = worker.requireEcsComponent(ActiveEffectsComponentId);
        assert.strictEqual(effects.effects.length, 1);
        const active = effects.effects[0];
        assert.strictEqual(active.source, worker.id);
        assert.strictEqual(active.effect.timing.type, "immediate");
        assert.strictEqual(
            (active.effect.data as { amount: number }).amount,
            50,
        );
    });

    it("adds a heal effect of 150 when drinking a greater health potion", () => {
        const { worker } = createDrinker();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = greaterHealthPotion;
        held.amount = 1;

        const result = executeDrinkFromHeldAction(
            { type: "drinkFromHeld" },
            worker,
        );
        assert.strictEqual(result.kind, "complete");

        const effects = worker.requireEcsComponent(ActiveEffectsComponentId);
        assert.strictEqual(
            (effects.effects[0].effect.data as { amount: number }).amount,
            150,
        );
    });

    it("decrements held amount without clearing a remaining stack", () => {
        const { worker } = createDrinker();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = healthPotion;
        held.amount = 2;

        executeDrinkFromHeldAction({ type: "drinkFromHeld" }, worker);

        assert.strictEqual(held.item, healthPotion);
        assert.strictEqual(held.amount, 1);
    });

    it("returns failed when held is empty", () => {
        const { worker } = createDrinker();
        const result = executeDrinkFromHeldAction(
            { type: "drinkFromHeld" },
            worker,
        );
        assert.strictEqual(result.kind, "failed");
    });

    it("returns failed when held item has no effect factory", () => {
        const { worker } = createDrinker();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = breadItem;
        held.amount = 2;

        const result = executeDrinkFromHeldAction(
            { type: "drinkFromHeld" },
            worker,
        );
        assert.strictEqual(result.kind, "failed");
        assert.strictEqual(held.amount, 2, "bread should be untouched");
    });

    it("heals the entity once the effect system runs", () => {
        const { root, worker } = createDrinker();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = healthPotion;
        held.amount = 1;

        executeDrinkFromHeldAction({ type: "drinkFromHeld" }, worker);
        createEffectSystem(createEffectExecutorMap()).onUpdate?.(root, 1);

        const health = worker.requireEcsComponent(HealthComponentId);
        assert.strictEqual(health.currentHp, 150);
        const effects = worker.requireEcsComponent(ActiveEffectsComponentId);
        assert.strictEqual(effects.effects.length, 0);
    });
});

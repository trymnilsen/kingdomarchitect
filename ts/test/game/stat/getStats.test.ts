import { describe, it } from "node:test";
import assert from "node:assert";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createStatsComponent } from "../../../src/game/component/statsComponent.ts";
import { createActiveEffectsComponent } from "../../../src/game/component/activeEffectsComponent.ts";
import { createEquipmentComponent } from "../../../src/game/component/equipmentComponent.ts";
import { getStats, getStatBreakdown } from "../../../src/game/stat/getStats.ts";
import type { InventoryItem } from "../../../src/data/inventory/inventoryItem.ts";
import { emptySpriteRef } from "../../../src/asset/sprite.ts";


function makeEntity(): Entity {
    const entity = new Entity("test-entity-12");
    entity.setEcsComponent(createStatsComponent());
    return entity;
}

function makeEffect(name: string = "Test Effect") {
    return {
        id: "test-effect",
        name,
        sprite: "empty_sprite" as const,
        timing: { type: "periodic" as const, ticks: 10, interval: 1 },
        data: {},
    };
}

describe("getStats", () => {
    it("applies flat modifier from active effect", () => {
        const entity = makeEntity();
        const effectsComponent = createActiveEffectsComponent();
        entity.setEcsComponent(effectsComponent);

        effectsComponent.effects.push({
            effect: makeEffect(),
            source: "test",
            modifiers: { might: { flat: 3 } },
            state: {},
            remainingTicks: 10,
            ticksSinceLastApplication: 0,
        });

        const stats = getStats(entity);
        assert.strictEqual(stats.might, 8); // 5 base + 3 flat
    });

    it("applies percent modifier from active effect", () => {
        const entity = makeEntity();
        const effectsComponent = createActiveEffectsComponent();
        entity.setEcsComponent(effectsComponent);

        effectsComponent.effects.push({
            effect: makeEffect(),
            source: "test",
            modifiers: { might: { percent: 0.2 } },
            state: {},
            remainingTicks: 10,
            ticksSinceLastApplication: 0,
        });

        const stats = getStats(entity);
        assert.strictEqual(stats.might, 6); // floor(5 * 1.2) = 6
    });

    it("applies flat before percent: (base + flat) * (1 + pct)", () => {
        const entity = makeEntity();
        const effectsComponent = createActiveEffectsComponent();
        entity.setEcsComponent(effectsComponent);

        effectsComponent.effects.push({
            effect: makeEffect(),
            source: "test",
            modifiers: { might: { flat: 2, percent: 0.5 } },
            state: {},
            remainingTicks: 10,
            ticksSinceLastApplication: 0,
        });

        const stats = getStats(entity);
        assert.strictEqual(stats.might, 10); // floor((5 + 2) * 1.5) = floor(10.5) = 10
    });

    it("applies stat modifier from equipped item", () => {
        const entity = makeEntity();
        const equipment = createEquipmentComponent();
        entity.setEcsComponent(equipment);

        const item: InventoryItem = {
            id: "iron-sword",
            name: "Iron Sword",
            asset: emptySpriteRef,
            statModifiers: { wit: { flat: 2 } },
        };
        equipment.slots.main = item;

        const stats = getStats(entity);
        assert.strictEqual(stats.wit, 7); // 5 base + 2 flat
    });

    it("clamps stats to minimum of 1 from debuffs", () => {
        const entity = makeEntity();
        const effectsComponent = createActiveEffectsComponent();
        entity.setEcsComponent(effectsComponent);

        effectsComponent.effects.push({
            effect: makeEffect(),
            source: "test",
            modifiers: { might: { flat: -100 } },
            state: {},
            remainingTicks: 10,
            ticksSinceLastApplication: 0,
        });

        const stats = getStats(entity);
        assert.strictEqual(stats.might, 1);
    });
});

describe("getStatBreakdown", () => {
    it("includes effect contributor with correct label and modifier values", () => {
        const entity = makeEntity();
        const effectsComponent = createActiveEffectsComponent();
        entity.setEcsComponent(effectsComponent);

        effectsComponent.effects.push({
            effect: makeEffect("Exhaustion"),
            source: "test",
            modifiers: { might: { flat: -2 } },
            state: {},
            remainingTicks: 5,
            ticksSinceLastApplication: 0,
        });

        const breakdown = getStatBreakdown(entity, "might");

        assert.strictEqual(breakdown.length, 2);
        assert.strictEqual(breakdown[1].label, "Exhaustion");
        assert.strictEqual(breakdown[1].flat, -2);
    });
});

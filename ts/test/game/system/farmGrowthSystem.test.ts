import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    createFarmComponent,
    FarmComponentId,
    FarmState,
} from "../../../src/game/component/farmComponent.ts";
import { farmGrowthSystem } from "../../../src/game/system/farmGrowthSystem.ts";

function createFarmEntity(root: Entity, id: string): Entity {
    const entity = new Entity(id);
    entity.worldPosition = { x: 12, y: 8 };
    entity.setEcsComponent(createFarmComponent());
    root.addChild(entity);
    return entity;
}

describe("FarmGrowthSystem", () => {
    it("does not change an Empty farm", () => {
        const root = new Entity("root");
        const farm = createFarmEntity(root, "farm-1");

        farmGrowthSystem.onUpdate!(root, 10);

        const comp = farm.requireEcsComponent(FarmComponentId);
        assert.strictEqual(comp.state, FarmState.Empty);
    });

    it("Growing farm stays Growing before duration elapses", () => {
        const root = new Entity("root");
        const farm = createFarmEntity(root, "farm-1");
        const comp = farm.requireEcsComponent(FarmComponentId);
        comp.state = FarmState.Growing;
        comp.plantedAtTick = 100;

        farmGrowthSystem.onUpdate!(root, 150); // 50 ticks elapsed, needs 60

        assert.strictEqual(comp.state, FarmState.Growing);
    });

    it("Growing farm transitions to Ready after growthDuration elapses", () => {
        const root = new Entity("root");
        const farm = createFarmEntity(root, "farm-1");
        const comp = farm.requireEcsComponent(FarmComponentId);
        comp.state = FarmState.Growing;
        comp.plantedAtTick = 100;

        farmGrowthSystem.onUpdate!(root, 160); // 60 ticks elapsed, exactly at threshold

        assert.strictEqual(comp.state, FarmState.Ready);
    });

    it("two farms with different plantedAtTick transition independently", () => {
        const root = new Entity("root");

        const farm1 = createFarmEntity(root, "farm-1");
        const comp1 = farm1.requireEcsComponent(FarmComponentId);
        comp1.state = FarmState.Growing;
        comp1.plantedAtTick = 50;

        const farm2 = createFarmEntity(root, "farm-2");
        const comp2 = farm2.requireEcsComponent(FarmComponentId);
        comp2.state = FarmState.Growing;
        comp2.plantedAtTick = 100;

        // At tick 110: farm1 has 60 ticks (ready), farm2 has 10 ticks (still growing)
        farmGrowthSystem.onUpdate!(root, 110);

        assert.strictEqual(comp1.state, FarmState.Ready, "farm1 should be Ready");
        assert.strictEqual(comp2.state, FarmState.Growing, "farm2 should still be Growing");
    });
});

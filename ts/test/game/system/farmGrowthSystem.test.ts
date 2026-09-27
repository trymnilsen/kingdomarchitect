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
});

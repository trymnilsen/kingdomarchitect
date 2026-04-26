import { describe, it } from "node:test";
import assert from "node:assert";
import { EcsWorld } from "../../../src/common/ecs/ecsWorld.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createGoblinUnitComponent } from "../../../src/game/component/goblinUnitComponent.ts";
import {
    createHealthComponent,
} from "../../../src/game/component/healthComponent.ts";
import { damageEntity } from "../../../src/game/component/healthComponent.ts";
import { createJobQueueComponent } from "../../../src/game/component/jobQueueComponent.ts";
import { createPlayerKingdomComponent } from "../../../src/game/component/playerKingdomComponent.ts";
import {
    CollectableComponentId,
    hasCollectableItems,
} from "../../../src/game/component/collectableComponent.ts";
import { lootDropSystem } from "../../../src/game/system/lootDropSystem.ts";

describe("lootDropSystem", () => {
    it("spawns a collectable entity when a goblin is killed", () => {
        const root = new Entity("root");
        const world = new EcsWorld(root);
        world.addSystem(lootDropSystem);

        const settlement = new Entity("settlement");
        settlement.setEcsComponent(createPlayerKingdomComponent());
        settlement.setEcsComponent(createJobQueueComponent());
        root.addChild(settlement);

        const goblin = new Entity("goblin-1");
        goblin.setEcsComponent(createGoblinUnitComponent("camp-1"));
        goblin.setEcsComponent(createHealthComponent(10, 10));
        root.addChild(goblin);
        goblin.worldPosition = { x: 12, y: 8 };

        damageEntity(goblin, 100, 1);

        const collectables = root.queryComponents(CollectableComponentId);
        assert.ok(collectables.size > 0, "a collectable entity should exist after goblin death");

        const [[, collectableComponent]] = collectables;
        assert.ok(
            hasCollectableItems(collectableComponent),
            "collectable entity should have items",
        );
    });

    it("does not spawn loot when a non-goblin entity dies", () => {
        const root = new Entity("root");
        const world = new EcsWorld(root);
        world.addSystem(lootDropSystem);

        const unit = new Entity("unit-1");
        unit.setEcsComponent(createHealthComponent(10, 10));
        root.addChild(unit);
        unit.worldPosition = { x: 5, y: 5 };

        damageEntity(unit, 100, 1);

        const collectables = root.queryComponents(CollectableComponentId);
        assert.strictEqual(collectables.size, 0, "no collectable should spawn for a non-goblin death");
    });
});

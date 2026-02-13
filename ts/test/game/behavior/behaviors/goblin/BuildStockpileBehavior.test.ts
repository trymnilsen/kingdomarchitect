import { describe, it } from "node:test";
import assert from "node:assert";
import { createBuildStockpileBehavior } from "../../../../../src/game/behavior/behaviors/goblin/BuildStockpileBehavior.ts";
import { Entity } from "../../../../../src/game/entity/entity.ts";
import { createGoblinUnitComponent } from "../../../../../src/game/component/goblinUnitComponent.ts";
import { createGoblinCampComponent } from "../../../../../src/game/component/goblinCampComponent.ts";
import { createStockpileComponent } from "../../../../../src/game/component/stockpileComponent.ts";
import { createBuildingComponent } from "../../../../../src/game/component/buildingComponent.ts";
import { stockPile } from "../../../../../src/data/building/wood/storage.ts";

function createTestGoblin(campEntityId: string = "camp-1"): Entity {
    const entity = new Entity("goblin-1");
    entity.setEcsComponent(createGoblinUnitComponent(campEntityId));
    return entity;
}

function createTestCamp(id: string = "camp-1"): Entity {
    const camp = new Entity(id);
    camp.setEcsComponent(createGoblinCampComponent());
    return camp;
}

function createTestStockpile(scaffolded: boolean = false): Entity {
    const stockpileEntity = new Entity("stockpile-1");
    stockpileEntity.setEcsComponent(createBuildingComponent(stockPile, scaffolded));
    if (!scaffolded) {
        stockpileEntity.setEcsComponent(createStockpileComponent());
    }
    return stockpileEntity;
}

describe("BuildStockpileBehavior", () => {
    describe("isValid", () => {
        it("returns false when population is 1", () => {
            const behavior = createBuildStockpileBehavior();
            const root = new Entity("root");
            const camp = createTestCamp("camp-1");
            const goblin = createTestGoblin("camp-1");

            camp.addChild(goblin);
            root.addChild(camp);

            const valid = behavior.isValid(goblin);

            assert.strictEqual(valid, false);
        });

        it("returns true when population > 1 and no stockpile exists", () => {
            const behavior = createBuildStockpileBehavior();
            const root = new Entity("root");
            const camp = createTestCamp("camp-1");
            const goblin1 = createTestGoblin("camp-1");
            const goblin2 = new Entity("goblin-2");
            goblin2.setEcsComponent(createGoblinUnitComponent("camp-1"));

            camp.addChild(goblin1);
            camp.addChild(goblin2);
            root.addChild(camp);

            const valid = behavior.isValid(goblin1);

            assert.strictEqual(valid, true);
        });

        it("returns false when stockpile already exists", () => {
            const behavior = createBuildStockpileBehavior();
            const root = new Entity("root");
            const camp = createTestCamp("camp-1");
            const goblin1 = createTestGoblin("camp-1");
            const goblin2 = new Entity("goblin-2");
            goblin2.setEcsComponent(createGoblinUnitComponent("camp-1"));
            const stockpileEntity = createTestStockpile(false);

            camp.addChild(goblin1);
            camp.addChild(goblin2);
            camp.addChild(stockpileEntity);
            root.addChild(camp);

            const valid = behavior.isValid(goblin1);

            assert.strictEqual(valid, false);
        });

        it("returns false when scaffolded stockpile exists", () => {
            const behavior = createBuildStockpileBehavior();
            const root = new Entity("root");
            const camp = createTestCamp("camp-1");
            const goblin1 = createTestGoblin("camp-1");
            const goblin2 = new Entity("goblin-2");
            goblin2.setEcsComponent(createGoblinUnitComponent("camp-1"));
            const stockpileEntity = createTestStockpile(true);

            camp.addChild(goblin1);
            camp.addChild(goblin2);
            camp.addChild(stockpileEntity);
            root.addChild(camp);

            const valid = behavior.isValid(goblin1);

            assert.strictEqual(valid, false);
        });

        it("returns false when entity has no goblin unit component", () => {
            const behavior = createBuildStockpileBehavior();
            const goblin = new Entity("goblin-1");

            const valid = behavior.isValid(goblin);

            assert.strictEqual(valid, false);
        });

        it("returns false when camp not found", () => {
            const behavior = createBuildStockpileBehavior();
            const root = new Entity("root");
            const goblin = createTestGoblin("nonexistent-camp");
            root.addChild(goblin);

            const valid = behavior.isValid(goblin);

            assert.strictEqual(valid, false);
        });
    });

    describe("utility", () => {
        it("returns 50", () => {
            const behavior = createBuildStockpileBehavior();
            const goblin = createTestGoblin();

            const utility = behavior.utility(goblin);

            assert.strictEqual(utility, 50);
        });
    });

    describe("name", () => {
        it("has name 'buildStockpile'", () => {
            const behavior = createBuildStockpileBehavior();

            assert.strictEqual(behavior.name, "buildStockpile");
        });
    });
});

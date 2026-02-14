import { describe, it } from "node:test";
import assert from "node:assert";
import { createExpandCampBehavior } from "../../../../../src/game/behavior/behaviors/goblin/expandCampBehavior.ts";
import { Entity } from "../../../../../src/game/entity/entity.ts";
import { createGoblinUnitComponent } from "../../../../../src/game/component/goblinUnitComponent.ts";
import { createGoblinCampComponent } from "../../../../../src/game/component/goblinCampComponent.ts";
import { createFireSourceComponent } from "../../../../../src/game/component/fireSourceComponent.ts";
import { createBuildingComponent } from "../../../../../src/game/component/buildingComponent.ts";
import { createHousingComponent } from "../../../../../src/game/component/housingComponent.ts";
import { goblinHut } from "../../../../../src/data/building/goblin/goblinHut.ts";

function createTestGoblin(campEntityId: string = "camp-1"): Entity {
    const entity = new Entity("goblin-1");
    entity.setEcsComponent(createGoblinUnitComponent(campEntityId));
    return entity;
}

function createTestCamp(id: string = "camp-1", maxPopulation: number = 5): Entity {
    const camp = new Entity(id);
    camp.setEcsComponent(createGoblinCampComponent(maxPopulation));
    return camp;
}

function createTestFire(active: boolean = true): Entity {
    const fire = new Entity("fire-1");
    const fireComponent = createFireSourceComponent(15, 2, 1);
    fireComponent.isActive = active;
    fire.setEcsComponent(fireComponent);
    return fire;
}

function createTestHut(scaffolded: boolean = false, tenant: Entity | null = null): Entity {
    const hut = new Entity("hut-1");
    hut.setEcsComponent(createBuildingComponent(goblinHut, scaffolded));
    if (!scaffolded) {
        hut.setEcsComponent(createHousingComponent(tenant));
    }
    return hut;
}

describe("ExpandCampBehavior", () => {
    describe("isValid", () => {
        it("returns false when entity has no goblin unit component", () => {
            const behavior = createExpandCampBehavior();
            const goblin = new Entity("goblin-1");

            const valid = behavior.isValid(goblin);

            assert.strictEqual(valid, false);
        });

        it("returns false when camp not found", () => {
            const behavior = createExpandCampBehavior();
            const root = new Entity("root");
            const goblin = createTestGoblin("nonexistent-camp");
            root.addChild(goblin);

            const valid = behavior.isValid(goblin);

            assert.strictEqual(valid, false);
        });

        it("returns false when camp has no active fire", () => {
            const behavior = createExpandCampBehavior();
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const goblin1 = createTestGoblin("camp-1");
            const goblin2 = new Entity("goblin-2");
            goblin2.setEcsComponent(createGoblinUnitComponent("camp-1"));

            camp.addChild(goblin1);
            camp.addChild(goblin2);
            root.addChild(camp);

            const valid = behavior.isValid(goblin1);

            assert.strictEqual(valid, false);
        });

        it("returns false when fire is not active", () => {
            const behavior = createExpandCampBehavior();
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const goblin1 = createTestGoblin("camp-1");
            const goblin2 = new Entity("goblin-2");
            goblin2.setEcsComponent(createGoblinUnitComponent("camp-1"));
            const fire = createTestFire(false);

            camp.addChild(fire);
            camp.addChild(goblin1);
            camp.addChild(goblin2);
            root.addChild(camp);

            const valid = behavior.isValid(goblin1);

            assert.strictEqual(valid, false);
        });

        it("returns false when population is at max", () => {
            const behavior = createExpandCampBehavior();
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 2);
            const fire = createTestFire(true);
            const goblin1 = createTestGoblin("camp-1");
            const goblin2 = new Entity("goblin-2");
            goblin2.setEcsComponent(createGoblinUnitComponent("camp-1"));

            camp.addChild(fire);
            camp.addChild(goblin1);
            camp.addChild(goblin2);
            root.addChild(camp);

            const valid = behavior.isValid(goblin1);

            assert.strictEqual(valid, false);
        });

        it("returns false when available hut exists", () => {
            const behavior = createExpandCampBehavior();
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const fire = createTestFire(true);
            const goblin1 = createTestGoblin("camp-1");
            const goblin2 = new Entity("goblin-2");
            goblin2.setEcsComponent(createGoblinUnitComponent("camp-1"));
            const hut = createTestHut(false, null); // Available hut

            camp.addChild(fire);
            camp.addChild(goblin1);
            camp.addChild(goblin2);
            camp.addChild(hut);
            root.addChild(camp);

            const valid = behavior.isValid(goblin1);

            assert.strictEqual(valid, false);
        });

        it("returns true when scaffolded hut exists (goblin should continue building it)", () => {
            const behavior = createExpandCampBehavior();
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const fire = createTestFire(true);
            const goblin1 = createTestGoblin("camp-1");
            const goblin2 = new Entity("goblin-2");
            goblin2.setEcsComponent(createGoblinUnitComponent("camp-1"));
            const hut = createTestHut(true); // Scaffolded hut in progress

            camp.addChild(fire);
            camp.addChild(goblin1);
            camp.addChild(goblin2);
            camp.addChild(hut);
            root.addChild(camp);

            const valid = behavior.isValid(goblin1);

            assert.strictEqual(valid, true);
        });

        it("returns true when fire active, population < max, and all huts occupied", () => {
            const behavior = createExpandCampBehavior();
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const fire = createTestFire(true);
            const goblin1 = createTestGoblin("camp-1");
            const goblin2 = new Entity("goblin-2");
            goblin2.setEcsComponent(createGoblinUnitComponent("camp-1"));
            const hut = createTestHut(false, goblin2); // Occupied hut

            camp.addChild(fire);
            camp.addChild(goblin1);
            camp.addChild(goblin2);
            camp.addChild(hut);
            root.addChild(camp);

            const valid = behavior.isValid(goblin1);

            assert.strictEqual(valid, true);
        });

        it("returns true when fire active, population < max, and no huts exist", () => {
            const behavior = createExpandCampBehavior();
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const fire = createTestFire(true);
            const goblin1 = createTestGoblin("camp-1");
            const goblin2 = new Entity("goblin-2");
            goblin2.setEcsComponent(createGoblinUnitComponent("camp-1"));

            camp.addChild(fire);
            camp.addChild(goblin1);
            camp.addChild(goblin2);
            root.addChild(camp);

            const valid = behavior.isValid(goblin1);

            assert.strictEqual(valid, true);
        });
    });

    describe("utility", () => {
        it("returns 40", () => {
            const behavior = createExpandCampBehavior();
            const goblin = createTestGoblin();

            const utility = behavior.utility(goblin);

            assert.strictEqual(utility, 40);
        });
    });

    describe("name", () => {
        it("has name 'expandCamp'", () => {
            const behavior = createExpandCampBehavior();

            assert.strictEqual(behavior.name, "expandCamp");
        });
    });
});

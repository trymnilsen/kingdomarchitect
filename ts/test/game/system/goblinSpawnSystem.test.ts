import { describe, it } from "node:test";
import assert from "node:assert";
import { goblinSpawnSystem } from "../../../src/game/system/goblinSpawnSystem.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createGoblinCampComponent } from "../../../src/game/component/goblinCampComponent.ts";
import { createGoblinUnitComponent } from "../../../src/game/component/goblinUnitComponent.ts";
import { createFireSourceComponent } from "../../../src/game/component/fireSourceComponent.ts";
import { createBuildingComponent } from "../../../src/game/component/buildingComponent.ts";
import { createHousingComponent, HousingComponentId } from "../../../src/game/component/housingComponent.ts";
import { goblinHut } from "../../../src/data/building/goblin/goblinHut.ts";
import { InvalidationTracker } from "../behavior/behaviorTestHelpers.ts";

function createTestCamp(id: string = "camp-1", maxPopulation: number = 5): Entity {
    const camp = new Entity(id);
    camp.setEcsComponent(createGoblinCampComponent(maxPopulation));
    return camp;
}

function createTestGoblin(campEntityId: string, id: string = "goblin-1"): Entity {
    const goblin = new Entity(id);
    goblin.setEcsComponent(createGoblinUnitComponent(campEntityId));
    return goblin;
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
    hut.position = { x: 5, y: 5 };
    return hut;
}

function countGoblinsInCamp(root: Entity, campId: string): number {
    const goblins = root.queryComponents("GoblinUnit");
    let count = 0;
    for (const [_entity, goblinUnit] of goblins) {
        if ((goblinUnit as any).campEntityId === campId) {
            count++;
        }
    }
    return count;
}

describe("goblinSpawnSystem", () => {
    describe("spawn conditions", () => {
        it("does not spawn when no active fire", () => {
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const hut = createTestHut(false, null);

            camp.addChild(hut);
            root.addChild(camp);

            const initialCount = countGoblinsInCamp(root, "camp-1");
            goblinSpawnSystem.onUpdate!(root, 1);
            const finalCount = countGoblinsInCamp(root, "camp-1");

            assert.strictEqual(initialCount, 0);
            assert.strictEqual(finalCount, 0);
        });

        it("does not spawn when fire is inactive", () => {
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const fire = createTestFire(false);
            const hut = createTestHut(false, null);

            camp.addChild(fire);
            camp.addChild(hut);
            root.addChild(camp);

            const initialCount = countGoblinsInCamp(root, "camp-1");
            goblinSpawnSystem.onUpdate!(root, 1);
            const finalCount = countGoblinsInCamp(root, "camp-1");

            assert.strictEqual(initialCount, 0);
            assert.strictEqual(finalCount, 0);
        });

        it("does not spawn when at max population", () => {
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 2);
            const fire = createTestFire(true);
            const goblin1 = createTestGoblin("camp-1", "goblin-1");
            const goblin2 = createTestGoblin("camp-1", "goblin-2");
            const hut = createTestHut(false, null);

            camp.addChild(fire);
            camp.addChild(goblin1);
            camp.addChild(goblin2);
            camp.addChild(hut);
            root.addChild(camp);

            const initialCount = countGoblinsInCamp(root, "camp-1");
            goblinSpawnSystem.onUpdate!(root, 1);
            const finalCount = countGoblinsInCamp(root, "camp-1");

            assert.strictEqual(initialCount, 2);
            assert.strictEqual(finalCount, 2);
        });

        it("does not spawn when no available hut", () => {
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const fire = createTestFire(true);
            const existingGoblin = createTestGoblin("camp-1", "existing-goblin");
            const hut = createTestHut(false, existingGoblin); // Occupied

            camp.addChild(fire);
            camp.addChild(existingGoblin);
            camp.addChild(hut);
            root.addChild(camp);

            const initialCount = countGoblinsInCamp(root, "camp-1");
            goblinSpawnSystem.onUpdate!(root, 1);
            const finalCount = countGoblinsInCamp(root, "camp-1");

            assert.strictEqual(initialCount, 1);
            assert.strictEqual(finalCount, 1);
        });

        it("does not spawn when hut is scaffolded", () => {
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const fire = createTestFire(true);
            const hut = createTestHut(true); // Scaffolded

            camp.addChild(fire);
            camp.addChild(hut);
            root.addChild(camp);

            const initialCount = countGoblinsInCamp(root, "camp-1");
            goblinSpawnSystem.onUpdate!(root, 1);
            const finalCount = countGoblinsInCamp(root, "camp-1");

            assert.strictEqual(initialCount, 0);
            assert.strictEqual(finalCount, 0);
        });
    });

    describe("spawning behavior", () => {
        it("spawns goblin when all conditions met", () => {
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const fire = createTestFire(true);
            const hut = createTestHut(false, null);

            camp.addChild(fire);
            camp.addChild(hut);
            root.addChild(camp);

            const initialCount = countGoblinsInCamp(root, "camp-1");
            goblinSpawnSystem.onUpdate!(root, 1);
            const finalCount = countGoblinsInCamp(root, "camp-1");

            assert.strictEqual(initialCount, 0);
            assert.strictEqual(finalCount, 1);
        });

        it("assigns housing to spawned goblin", () => {
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const fire = createTestFire(true);
            const hut = createTestHut(false, null);

            camp.addChild(fire);
            camp.addChild(hut);
            root.addChild(camp);

            goblinSpawnSystem.onUpdate!(root, 1);

            const housing = hut.getEcsComponent("housing");
            assert.ok(housing);
            assert.ok((housing as any).tenant !== null);
        });

        it("spawns only one goblin per tick per hut", () => {
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const fire = createTestFire(true);
            const hut = createTestHut(false, null);

            camp.addChild(fire);
            camp.addChild(hut);
            root.addChild(camp);

            goblinSpawnSystem.onUpdate!(root, 1);
            const countAfterFirst = countGoblinsInCamp(root, "camp-1");

            goblinSpawnSystem.onUpdate!(root, 2);
            const countAfterSecond = countGoblinsInCamp(root, "camp-1");

            assert.strictEqual(countAfterFirst, 1);
            assert.strictEqual(countAfterSecond, 1); // Still 1, hut is now occupied
        });

        it("spawns multiple goblins when multiple huts available", () => {
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const fire = createTestFire(true);
            const hut1 = new Entity("hut-1");
            hut1.setEcsComponent(createBuildingComponent(goblinHut, false));
            hut1.setEcsComponent(createHousingComponent(null));
            const hut2 = new Entity("hut-2");
            hut2.setEcsComponent(createBuildingComponent(goblinHut, false));
            hut2.setEcsComponent(createHousingComponent(null));

            camp.addChild(fire);
            camp.addChild(hut1);
            camp.addChild(hut2);
            root.addChild(camp);

            goblinSpawnSystem.onUpdate!(root, 1);
            const countAfterFirst = countGoblinsInCamp(root, "camp-1");

            goblinSpawnSystem.onUpdate!(root, 2);
            const countAfterSecond = countGoblinsInCamp(root, "camp-1");

            assert.strictEqual(countAfterFirst, 1);
            assert.strictEqual(countAfterSecond, 2);
        });
    });

    describe("multiple camps", () => {
        it("processes each camp independently", () => {
            const root = new Entity("root");
            const camp1 = createTestCamp("camp-1", 5);
            const fire1 = new Entity("fire-1");
            const fire1Component = createFireSourceComponent(15, 2, 1);
            fire1Component.isActive = true;
            fire1.setEcsComponent(fire1Component);
            const hut1 = new Entity("hut-1");
            hut1.setEcsComponent(createBuildingComponent(goblinHut, false));
            hut1.setEcsComponent(createHousingComponent(null));

            const camp2 = createTestCamp("camp-2", 5);
            const fire2 = new Entity("fire-2");
            const fire2Component = createFireSourceComponent(15, 2, 1);
            fire2Component.isActive = true;
            fire2.setEcsComponent(fire2Component);
            const hut2 = new Entity("hut-2");
            hut2.setEcsComponent(createBuildingComponent(goblinHut, false));
            hut2.setEcsComponent(createHousingComponent(null));

            camp1.addChild(fire1);
            camp1.addChild(hut1);
            camp2.addChild(fire2);
            camp2.addChild(hut2);
            root.addChild(camp1);
            root.addChild(camp2);

            goblinSpawnSystem.onUpdate!(root, 1);

            const count1 = countGoblinsInCamp(root, "camp-1");
            const count2 = countGoblinsInCamp(root, "camp-2");

            assert.strictEqual(count1, 1);
            assert.strictEqual(count2, 1);
        });
    });

    describe("component invalidation", () => {
        it("invalidates HousingComponent when goblin spawns", () => {
            const root = new Entity("root");
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const camp = createTestCamp("camp-1", 5);
            const fire = createTestFire(true);
            const hut = createTestHut(false, null);

            camp.addChild(fire);
            camp.addChild(hut);
            root.addChild(camp);

            goblinSpawnSystem.onUpdate!(root, 1);

            assert.strictEqual(
                tracker.wasInvalidated("hut-1", HousingComponentId),
                true,
                "HousingComponent should be invalidated when goblin is assigned housing",
            );
        });

        it("does not invalidate HousingComponent when no fire", () => {
            const root = new Entity("root");
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const camp = createTestCamp("camp-1", 5);
            const hut = createTestHut(false, null);

            camp.addChild(hut);
            root.addChild(camp);

            goblinSpawnSystem.onUpdate!(root, 1);

            assert.strictEqual(
                tracker.wasInvalidated("hut-1", HousingComponentId),
                false,
                "HousingComponent should not be invalidated when spawn conditions not met",
            );
        });

        it("does not invalidate HousingComponent when at max population", () => {
            const root = new Entity("root");
            const tracker = new InvalidationTracker();
            tracker.attach(root);

            const camp = createTestCamp("camp-1", 1);
            const fire = createTestFire(true);
            const existingGoblin = createTestGoblin("camp-1", "existing-goblin");
            const hut = createTestHut(false, existingGoblin);

            camp.addChild(fire);
            camp.addChild(existingGoblin);
            camp.addChild(hut);
            root.addChild(camp);

            goblinSpawnSystem.onUpdate!(root, 1);

            assert.strictEqual(
                tracker.wasInvalidated("hut-1", HousingComponentId),
                false,
                "HousingComponent should not be invalidated when at max population",
            );
        });
    });
});

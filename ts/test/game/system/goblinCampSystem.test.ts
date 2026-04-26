import { describe, it } from "node:test";
import assert from "node:assert";
import { goblinCampSystem } from "../../../src/game/system/goblinCampSystem.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createGoblinCampComponent, GoblinCampComponentId } from "../../../src/game/component/goblinCampComponent.ts";
import { createGoblinUnitComponent } from "../../../src/game/component/goblinUnitComponent.ts";
import { createFireSourceComponent } from "../../../src/game/component/fireSourceComponent.ts";
import { createBuildingComponent } from "../../../src/game/component/buildingComponent.ts";
import { createHousingComponent, HousingComponentId } from "../../../src/game/component/housingComponent.ts";
import { createJobQueueComponent } from "../../../src/game/component/jobQueueComponent.ts";
import { goblinHut } from "../../../src/data/building/goblin/goblinHut.ts";
import { goblinCampfire } from "../../../src/data/building/goblin/goblinCampfire.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../src/game/component/tileComponent.ts";
import { createChunkMapComponent } from "../../../src/game/component/chunkMapComponent.ts";

function setupWorldComponents(root: Entity): void {
    const tileComponent = createTileComponent();
    setChunk(tileComponent, { chunkX: 0, chunkY: 0 });
    root.setEcsComponent(tileComponent);
    root.setEcsComponent(createChunkMapComponent());
}

function createTestCamp(id: string = "camp-1", maxPopulation: number = 5): Entity {
    const camp = new Entity(id);
    camp.setEcsComponent(createGoblinCampComponent(maxPopulation));
    camp.setEcsComponent(createJobQueueComponent());
    return camp;
}

function createTestGoblin(campEntityId: string, id: string = "goblin-1"): Entity {
    const goblin = new Entity(id);
    goblin.setEcsComponent(createGoblinUnitComponent(campEntityId));
    return goblin;
}

function createTestCampfire(id: string = "fire-1", active: boolean = true): Entity {
    const fire = new Entity(id);
    const buildingComponent = createBuildingComponent(goblinCampfire, false);
    fire.setEcsComponent(buildingComponent);
    const fireComponent = createFireSourceComponent(15, 2, 1);
    fireComponent.isActive = active;
    fire.setEcsComponent(fireComponent);
    fire.position = { x: 12, y: 8 };
    return fire;
}

function createTestHut(id: string = "hut-1", scaffolded: boolean = false, tenant: Entity | null = null): Entity {
    const hut = new Entity(id);
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

describe("goblinCampSystem spawning", () => {
    describe("campfire fallback (population = 0)", () => {
        it("spawns a goblin when campfire is active and population is zero", () => {
            const root = new Entity("root");
            setupWorldComponents(root);
            const camp = createTestCamp("camp-1", 5);
            const campfire = createTestCampfire();

            camp.addChild(campfire);
            root.addChild(camp);
            camp.position = { x: 4, y: 4 };

            const initialCount = countGoblinsInCamp(root, "camp-1");
            goblinCampSystem.onUpdate!(root, 1);
            const finalCount = countGoblinsInCamp(root, "camp-1");

            assert.strictEqual(initialCount, 0);
            assert.strictEqual(finalCount, 1);
        });

        it("does not spawn when campfire is absent and population is zero", () => {
            const root = new Entity("root");
            setupWorldComponents(root);
            const camp = createTestCamp("camp-1", 5);

            root.addChild(camp);
            camp.position = { x: 4, y: 4 };

            goblinCampSystem.onUpdate!(root, 1);

            assert.strictEqual(countGoblinsInCamp(root, "camp-1"), 0);
        });

        it("does not assign housing when spawning via campfire fallback", () => {
            const root = new Entity("root");
            setupWorldComponents(root);
            const camp = createTestCamp("camp-1", 5);
            const campfire = createTestCampfire();
            const hut = createTestHut();

            camp.addChild(campfire);
            camp.addChild(hut);
            root.addChild(camp);
            camp.position = { x: 4, y: 4 };

            goblinCampSystem.onUpdate!(root, 1);

            const housing = hut.getEcsComponent(HousingComponentId);
            assert.strictEqual(housing?.tenant, null, "hut should remain unoccupied after campfire fallback spawn");
        });

        it("does not spawn when campfire is inactive", () => {
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const campfire = createTestCampfire("fire-1", false);

            camp.addChild(campfire);
            root.addChild(camp);

            goblinCampSystem.onUpdate!(root, 1);

            assert.strictEqual(countGoblinsInCamp(root, "camp-1"), 0);
        });
    });

    describe("house spawn (population > 0)", () => {
        it("spawns into an unoccupied hut when conditions are met", () => {
            const root = new Entity("root");
            setupWorldComponents(root);
            const camp = createTestCamp("camp-1", 5);
            const campfire = createTestCampfire();
            const existingGoblin = createTestGoblin("camp-1", "goblin-1");
            const hut = createTestHut();

            camp.addChild(campfire);
            camp.addChild(existingGoblin);
            camp.addChild(hut);
            root.addChild(camp);
            camp.position = { x: 4, y: 4 };

            const initialCount = countGoblinsInCamp(root, "camp-1");
            goblinCampSystem.onUpdate!(root, 1);
            const finalCount = countGoblinsInCamp(root, "camp-1");

            assert.strictEqual(initialCount, 1);
            assert.strictEqual(finalCount, 2);
        });

        it("assigns housing to the spawned goblin", () => {
            const root = new Entity("root");
            setupWorldComponents(root);
            const camp = createTestCamp("camp-1", 5);
            const campfire = createTestCampfire();
            const existingGoblin = createTestGoblin("camp-1", "goblin-1");
            const hut = createTestHut();

            camp.addChild(campfire);
            camp.addChild(existingGoblin);
            camp.addChild(hut);
            root.addChild(camp);
            camp.position = { x: 4, y: 4 };

            goblinCampSystem.onUpdate!(root, 1);

            const housing = hut.getEcsComponent(HousingComponentId);
            assert.ok(housing?.tenant !== null, "spawned goblin should be assigned to hut");
        });

        it("does not spawn when no available hut", () => {
            const root = new Entity("root");
            setupWorldComponents(root);
            const camp = createTestCamp("camp-1", 5);
            const campfire = createTestCampfire();
            const existingGoblin = createTestGoblin("camp-1", "goblin-1");
            const hut = createTestHut("hut-1", false, existingGoblin);

            camp.addChild(campfire);
            camp.addChild(existingGoblin);
            camp.addChild(hut);
            root.addChild(camp);
            camp.position = { x: 4, y: 4 };

            goblinCampSystem.onUpdate!(root, 1);

            assert.strictEqual(countGoblinsInCamp(root, "camp-1"), 1);
        });

        it("does not spawn when at max population", () => {
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 1);
            const campfire = createTestCampfire();
            const existingGoblin = createTestGoblin("camp-1", "goblin-1");
            const hut = createTestHut();

            camp.addChild(campfire);
            camp.addChild(existingGoblin);
            camp.addChild(hut);
            root.addChild(camp);

            goblinCampSystem.onUpdate!(root, 1);

            assert.strictEqual(countGoblinsInCamp(root, "camp-1"), 1);
        });

        it("does not spawn into a scaffolded hut", () => {
            const root = new Entity("root");
            const camp = createTestCamp("camp-1", 5);
            const campfire = createTestCampfire();
            const existingGoblin = createTestGoblin("camp-1", "goblin-1");
            const scaffoldedHut = createTestHut("hut-1", true);

            camp.addChild(campfire);
            camp.addChild(existingGoblin);
            camp.addChild(scaffoldedHut);
            root.addChild(camp);

            goblinCampSystem.onUpdate!(root, 1);

            assert.strictEqual(countGoblinsInCamp(root, "camp-1"), 1);
        });
    });

    describe("dead tenant handling", () => {
        it("clears a stale tenant reference and spawns into the freed hut", () => {
            const root = new Entity("root");
            setupWorldComponents(root);
            const camp = createTestCamp("camp-1", 5);
            const campfire = createTestCampfire();
            const existingGoblin = createTestGoblin("camp-1", "goblin-1");

            // Hut references a dead entity (not in tree)
            const hut = new Entity("hut-1");
            hut.setEcsComponent(createBuildingComponent(goblinHut, false));
            const housing = createHousingComponent(null);
            housing.tenant = "dead-goblin-id";
            hut.setEcsComponent(housing);
            hut.position = { x: 5, y: 5 };

            camp.addChild(campfire);
            camp.addChild(existingGoblin);
            camp.addChild(hut);
            root.addChild(camp);
            camp.position = { x: 4, y: 4 };

            goblinCampSystem.onUpdate!(root, 1);

            const updatedHousing = hut.getEcsComponent(HousingComponentId);
            assert.notStrictEqual(updatedHousing?.tenant, "dead-goblin-id", "stale tenant should be cleared");
            assert.strictEqual(countGoblinsInCamp(root, "camp-1"), 2, "new goblin should spawn into freed hut");
        });
    });
});

describe("goblinCampSystem camp removal", () => {
    it("removes GoblinCampComponent when population is zero, fire is gone, and no huts remain", () => {
        const root = new Entity("root");
        const camp = createTestCamp("camp-1", 5);
        root.addChild(camp);

        assert.ok(camp.hasComponent(GoblinCampComponentId));
        goblinCampSystem.onUpdate!(root, 1);
        assert.ok(!camp.hasComponent(GoblinCampComponentId), "camp component should be removed when fully cleared");
    });

    it("does not remove camp when goblins are still alive", () => {
        const root = new Entity("root");
        const camp = createTestCamp("camp-1", 5);
        const goblin = createTestGoblin("camp-1");

        camp.addChild(goblin);
        root.addChild(camp);

        goblinCampSystem.onUpdate!(root, 1);

        assert.ok(camp.hasComponent(GoblinCampComponentId), "camp should persist while goblins live");
    });

    it("does not remove camp when campfire is still active", () => {
        const root = new Entity("root");
        setupWorldComponents(root);
        const camp = createTestCamp("camp-1", 5);
        const campfire = createTestCampfire();

        camp.addChild(campfire);
        root.addChild(camp);
        camp.position = { x: 4, y: 4 };

        // The campfire is active so the camp should be preserved (spawning also fires, keeping pop > 0)
        goblinCampSystem.onUpdate!(root, 1);
        assert.ok(camp.hasComponent(GoblinCampComponentId), "camp should persist while campfire is active");
    });

    it("does not remove camp when a hut still exists", () => {
        const root = new Entity("root");
        const camp = createTestCamp("camp-1", 5);
        const hut = createTestHut();

        camp.addChild(hut);
        root.addChild(camp);

        goblinCampSystem.onUpdate!(root, 1);

        assert.ok(camp.hasComponent(GoblinCampComponentId), "camp should persist while huts remain");
    });

    it("keeps the entity in the world after component removal", () => {
        const root = new Entity("root");
        const camp = createTestCamp("camp-1", 5);
        root.addChild(camp);

        goblinCampSystem.onUpdate!(root, 1);

        assert.ok(!camp.hasComponent(GoblinCampComponentId));
        assert.ok(camp.parent !== undefined, "camp entity should still be attached to root");
    });
});

import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    createKingdomComponent,
    KingdomType,
} from "../../../src/game/component/kingdomComponent.ts";
import { createBuildingComponent } from "../../../src/game/component/buildingComponent.ts";
import { createVisibilityComponent } from "../../../src/game/component/visibilityComponent.ts";
import { playerKingdomPrefab } from "../../../src/game/prefab/playerKingdomPrefab.ts";
import { buildingPrefab } from "../../../src/game/prefab/buildingPrefab.ts";
import { workerPrefab } from "../../../src/game/prefab/workerPrefab.ts";
import { woodenHouse } from "../../../src/data/building/wood/house.ts";
import { canReveal } from "../../../src/game/vision/visionReach.ts";

function kingdomEntity(id: string, type: KingdomType): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createKingdomComponent(type));
    return entity;
}

describe("seesRightNow", () => {
    it("is true for a worker under the player kingdom", () => {
        const kingdom = playerKingdomPrefab();
        const worker = workerPrefab();
        kingdom.addChild(worker);

        assert.strictEqual(canReveal(worker), true);
    });

    it("is false for a worker that belongs to no kingdom", () => {
        const root = new Entity("root");
        const worker = workerPrefab();
        root.addChild(worker);

        assert.strictEqual(canReveal(worker), false);
    });

    it("is false for an owned entity with no vision", () => {
        const kingdom = playerKingdomPrefab();
        const decoration = new Entity("decoration");
        kingdom.addChild(decoration);

        assert.strictEqual(canReveal(decoration), false);
    });

    it("is false for a scaffold and true once the building is finished", () => {
        const kingdom = playerKingdomPrefab();
        const building = buildingPrefab(woodenHouse, true);
        kingdom.addChild(building);
        assert.strictEqual(canReveal(building), false);

        building.updateComponent("building", (component) => {
            component.scaffolded = false;
        });

        assert.strictEqual(canReveal(building), true);
    });

    it("is false for a finished building in a goblin kingdom", () => {
        const goblins = kingdomEntity("goblins", KingdomType.Goblin);
        const building = buildingPrefab(woodenHouse, false);
        goblins.addChild(building);

        assert.strictEqual(canReveal(building), false);
    });

    it("lets the nearest kingdom decide when kingdoms are nested", () => {
        // The player kingdom entity sits under a chunk entity, and a chunk that
        // hosts a goblin camp carries a goblin kingdom of its own.
        const chunk = kingdomEntity("chunk", KingdomType.Goblin);
        const player = playerKingdomPrefab();
        chunk.addChild(player);
        const worker = workerPrefab();
        player.addChild(worker);
        const goblinBuilding = new Entity("goblinBuilding");
        goblinBuilding.setEcsComponent(
            createBuildingComponent(woodenHouse, false),
        );
        goblinBuilding.setEcsComponent(createVisibilityComponent(1));
        chunk.addChild(goblinBuilding);

        assert.strictEqual(canReveal(worker), true);
        assert.strictEqual(canReveal(goblinBuilding), false);
    });
});

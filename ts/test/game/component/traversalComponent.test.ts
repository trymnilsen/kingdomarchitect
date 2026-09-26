import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createBuildingComponent } from "../../../src/game/component/buildingComponent.ts";
import {
    createTraversalComponent,
    isImpassableStructure,
    TRAVERSAL_IMPASSABLE_THRESHOLD,
} from "../../../src/game/component/traversalComponent.ts";
import type { Building } from "../../../src/data/building/building.ts";

const road = {
    id: "road",
    name: "Road",
    traversalWeight: 1,
} as unknown as Building;
const wall = { id: "wall", name: "Wall" } as unknown as Building;

function buildingEntity(building: Building, traversalWeight?: number): Entity {
    const entity = new Entity("building");
    entity.setEcsComponent(createBuildingComponent(building, false));
    if (traversalWeight !== undefined) {
        entity.setEcsComponent(createTraversalComponent(traversalWeight));
    }
    return entity;
}

describe("isImpassableStructure", () => {
    it("lets a traversal component override the definition in both directions", () => {
        // This is how a gate works: the definition says walkable, and shutting
        // it writes a weight above the threshold onto the entity.
        const shut = buildingEntity(road, TRAVERSAL_IMPASSABLE_THRESHOLD);
        assert.strictEqual(isImpassableStructure(shut), true);

        // And the reverse, so a normally solid building can be opened up.
        const opened = buildingEntity(wall, 1);
        assert.strictEqual(isImpassableStructure(opened), false);
    });

    it("treats traversal weight at the threshold as impassable", () => {
        const entity = buildingEntity(wall, TRAVERSAL_IMPASSABLE_THRESHOLD);
        assert.strictEqual(isImpassableStructure(entity), true);
    });
});

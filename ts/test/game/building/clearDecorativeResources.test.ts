import assert from "node:assert";
import { describe, it } from "node:test";
import {
    grassResource,
    treeResource,
} from "../../../src/data/inventory/items/naturalResource.ts";
import { clearDecorativeResourcesAt } from "../../../src/game/building/clearDecorativeResources.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { resourcePrefab } from "../../../src/game/prefab/resourcePrefab.ts";
import { createMinimalWorld } from "../testWorld.ts";

function addResourceAt(
    root: Entity,
    resource: typeof grassResource | typeof treeResource,
    position: { x: number; y: number },
): Entity {
    const entity = resourcePrefab(resource);
    root.addChild(entity);
    entity.worldPosition = position;
    return entity;
}

describe("clearDecorativeResourcesAt", () => {
    it("removes a decorative resource at the point", () => {
        const { root } = createMinimalWorld();
        const grass = addResourceAt(root, grassResource, { x: 3, y: 3 });

        clearDecorativeResourcesAt(root, { x: 3, y: 3 });

        assert.ok(!root.children.includes(grass), "grass should be removed");
    });

    it("leaves blocking resources untouched", () => {
        const { root } = createMinimalWorld();
        const tree = addResourceAt(root, treeResource, { x: 3, y: 3 });

        clearDecorativeResourcesAt(root, { x: 3, y: 3 });

        assert.ok(root.children.includes(tree), "tree should remain");
    });
});

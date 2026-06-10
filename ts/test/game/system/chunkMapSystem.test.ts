import assert from "node:assert";
import { describe, it } from "node:test";
import {
    ChunkMapComponentId,
    getEntitiesAt,
} from "../../../src/game/component/chunkMapComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { resourcePrefab } from "../../../src/game/prefab/resourcePrefab.ts";
import { treeResource } from "../../../src/data/inventory/items/naturalResource.ts";
import { createMinimalWorld } from "../testWorld.ts";
import { assertChunkMapMatchesTree } from "../worldInvariants.ts";

/**
 * The chunk map is the spatial index behind every placement query and
 * pathfinding weight. These tests pin that it tracks the entity tree
 * through adds, moves (including cross-chunk), parent moves, and removals.
 */
describe("chunkMapSystem", () => {
    function createWorldWithTree() {
        const world = createMinimalWorld();
        const tree = resourcePrefab(treeResource);
        world.root.addChild(tree);
        tree.worldPosition = { x: 2, y: 2 };
        return { ...world, tree };
    }

    function entitiesAt(root: Entity, x: number, y: number): Entity[] {
        const chunkMap = root.requireEcsComponent(ChunkMapComponentId).chunkMap;
        return getEntitiesAt(chunkMap, x, y);
    }

    it("indexes an added entity at its world position", () => {
        const { root, tree } = createWorldWithTree();

        assert.ok(entitiesAt(root, 2, 2).includes(tree));
        assertChunkMapMatchesTree(root);
    });

    it("reindexes an entity that moves across a chunk boundary", () => {
        const { root, tree } = createWorldWithTree();

        tree.worldPosition = { x: 10, y: 10 };

        assert.deepStrictEqual(entitiesAt(root, 2, 2), []);
        assert.ok(entitiesAt(root, 10, 10).includes(tree));
        assertChunkMapMatchesTree(root);
    });

    it("reindexes children when their parent moves", () => {
        const { root } = createMinimalWorld();
        const group = new Entity("group");
        root.addChild(group);
        group.worldPosition = { x: 1, y: 1 };
        const tree = resourcePrefab(treeResource);
        group.addChild(tree);
        tree.worldPosition = { x: 2, y: 2 };

        group.worldPosition = { x: 9, y: 9 };

        assert.deepStrictEqual(entitiesAt(root, 2, 2), []);
        assert.ok(entitiesAt(root, 10, 10).includes(tree));
        assertChunkMapMatchesTree(root);
    });

    it("drops an entity from the index when it is removed from the tree", () => {
        const { root, tree } = createWorldWithTree();

        tree.remove();

        assert.deepStrictEqual(entitiesAt(root, 2, 2), []);
        assertChunkMapMatchesTree(root);
    });
});

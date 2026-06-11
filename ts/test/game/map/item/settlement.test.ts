import assert from "node:assert";
import { describe, it } from "node:test";
import { placeSettlement } from "../../../../src/game/map/item/settlement.ts";
import { ChunkSize, getChunkBounds } from "../../../../src/game/map/chunk.ts";
import {
    ChunkMapComponentId,
    getEntitiesAt,
} from "../../../../src/game/component/chunkMapComponent.ts";
import { GoblinCampComponentId } from "../../../../src/game/component/goblinCampComponent.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { resourcePrefab } from "../../../../src/game/prefab/resourcePrefab.ts";
import {
    grassResource,
    treeResource,
} from "../../../../src/data/inventory/items/naturalResource.ts";
import { createMinimalWorld } from "../../testWorld.ts";
import {
    assertChunkMapMatchesTree,
    assertTransformsConsistent,
} from "../../worldInvariants.ts";

const chunkPosition = { x: 1, y: 1 };
const bounds = getChunkBounds(chunkPosition);
// The preferred camp anchor: campAnchor (4,3) offset by the chunk origin.
const preferredAnchor = { x: bounds.x1 + 4, y: bounds.y1 + 3 };

function createWorldWithChunk(): { root: Entity; chunkEntity: Entity } {
    const { root } = createMinimalWorld({ minChunk: 0, maxChunk: 1 });
    const chunkEntity = new Entity("chunk-1-1");
    chunkEntity.worldPosition = {
        x: chunkPosition.x * ChunkSize,
        y: chunkPosition.y * ChunkSize,
    };
    root.addChild(chunkEntity);
    return { root, chunkEntity };
}

function addTreeAt(
    chunkEntity: Entity,
    position: { x: number; y: number },
): Entity {
    const tree = resourcePrefab(treeResource);
    chunkEntity.addChild(tree);
    tree.worldPosition = position;
    return tree;
}

function findCamp(root: Entity): Entity {
    const camps = root.queryComponents(GoblinCampComponentId);
    assert.strictEqual(camps.size, 1, "exactly one camp should be placed");
    return [...camps.keys()][0];
}

describe("placeSettlement", () => {
    it("places the camp at the preferred anchor in an empty chunk", () => {
        const { root, chunkEntity } = createWorldWithChunk();
        const chunk = { chunkX: chunkPosition.x, chunkY: chunkPosition.y };

        placeSettlement(chunk, chunkEntity);

        const camp = findCamp(root);
        assert.strictEqual(camp.parent, chunkEntity);
        assert.deepStrictEqual(camp.worldPosition, preferredAnchor);
        assertTransformsConsistent(root);
        assertChunkMapMatchesTree(root);
    });

    it("places the camp on decorative grass and removes it", () => {
        const { root, chunkEntity } = createWorldWithChunk();
        const grass = resourcePrefab(grassResource);
        chunkEntity.addChild(grass);
        grass.worldPosition = preferredAnchor;
        const chunk = { chunkX: chunkPosition.x, chunkY: chunkPosition.y };

        placeSettlement(chunk, chunkEntity);

        const camp = findCamp(root);
        assert.deepStrictEqual(
            camp.worldPosition,
            preferredAnchor,
            "grass should not shift the camp off its preferred anchor",
        );
        assert.ok(
            !chunkEntity.children.includes(grass),
            "grass under the camp footprint should be removed",
        );
        assertTransformsConsistent(root);
        assertChunkMapMatchesTree(root);
    });

    it("shifts the camp to a free footprint when the anchor is occupied", () => {
        const { root, chunkEntity } = createWorldWithChunk();
        addTreeAt(chunkEntity, preferredAnchor);
        const chunk = { chunkX: chunkPosition.x, chunkY: chunkPosition.y };

        placeSettlement(chunk, chunkEntity);

        const camp = findCamp(root);
        assert.notDeepStrictEqual(camp.worldPosition, preferredAnchor);

        // The camp's footprint (its children's tiles) must be inside the
        // chunk and free of anything that is not part of the camp itself.
        const chunkMap =
            root.requireEcsComponent(ChunkMapComponentId).chunkMap;
        for (const member of camp.children) {
            const world = member.worldPosition;
            assert.ok(
                world.x >= bounds.x1 &&
                    world.x <= bounds.x2 &&
                    world.y >= bounds.y1 &&
                    world.y <= bounds.y2,
                `${member.id} at (${world.x},${world.y}) should be inside the chunk bounds`,
            );
            const occupants = getEntitiesAt(chunkMap, world.x, world.y);
            assert.ok(
                occupants.every(
                    (occupant) =>
                        occupant === camp || occupant.parent === camp,
                ),
                `tile (${world.x},${world.y}) should only hold camp members`,
            );
        }
        assertTransformsConsistent(root);
    });

    it("claims the preferred anchor and removes occupants when no tile is free", () => {
        const { root, chunkEntity } = createWorldWithChunk();
        const trees = new Map<string, Entity>();
        for (let x = bounds.x1; x <= bounds.x2; x++) {
            for (let y = bounds.y1; y <= bounds.y2; y++) {
                trees.set(`${x},${y}`, addTreeAt(chunkEntity, { x, y }));
            }
        }
        const chunk = { chunkX: chunkPosition.x, chunkY: chunkPosition.y };

        placeSettlement(chunk, chunkEntity);

        const camp = findCamp(root);
        assert.deepStrictEqual(
            camp.worldPosition,
            preferredAnchor,
            "a camp must always be placed, falling back to the preferred anchor",
        );

        // The occupants of the claimed footprint are removed; everything
        // else stays.
        const chunkMap =
            root.requireEcsComponent(ChunkMapComponentId).chunkMap;
        for (const member of camp.children) {
            const world = member.worldPosition;
            const displaced = trees.get(`${world.x},${world.y}`)!;
            assert.ok(
                !chunkEntity.children.includes(displaced),
                `tree at (${world.x},${world.y}) should have been removed`,
            );
            const occupants = getEntitiesAt(chunkMap, world.x, world.y);
            assert.ok(
                occupants.every((occupant) => occupant.parent === camp),
                `tile (${world.x},${world.y}) should only hold camp members`,
            );
        }
        assertChunkMapMatchesTree(root);
    });
});

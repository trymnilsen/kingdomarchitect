import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import { setDiscoveryForPlayer } from "../../../src/game/system/worldGenerationSystem.ts";
import {
    TileComponentId,
    hasChunk,
} from "../../../src/game/component/tileComponent.ts";
import { GoblinCampComponentId } from "../../../src/game/component/goblinCampComponent.ts";
import {
    WorldDiscoveryComponentId,
    hasDiscoveredTile,
} from "../../../src/game/component/worldDiscoveryComponent.ts";
import { ChunkSize, getChunkBounds } from "../../../src/game/map/chunk.ts";
import type { Entity } from "../../../src/game/entity/entity.ts";
import {
    assertChunkMapMatchesTree,
    assertTransformsConsistent,
} from "../worldInvariants.ts";

/**
 * Discovering a tile in an ungenerated chunk drives the full generation
 * path: generateChunk creates the chunk entity and biome contents, and
 * placeSettlementIfNoneExists hosts the goblin camp. These tests assert
 * the structural invariants that path must maintain — registered tiles,
 * consistent transforms, and a chunk map matching the entity tree —
 * rather than the (random) biome contents themselves.
 */

// Outside the harness's pre-seeded chunks (x 1..4, y 1..3), so the chunk
// does not exist until discovery generates it.
const chunkPosition = { x: 5, y: 2 };
const discoveredPoint = {
    x: chunkPosition.x * ChunkSize + 3,
    y: chunkPosition.y * ChunkSize + 4,
};

function discoverChunk(): { harness: ScenarioHarness; chunkEntity: Entity } {
    const harness = new ScenarioHarness();
    const childrenBefore = new Set(harness.root.children);

    setDiscoveryForPlayer(harness.root, () => {}, "player", [discoveredPoint]);

    const newChildren = harness.root.children.filter(
        (child) => !childrenBefore.has(child),
    );
    assert.strictEqual(
        newChildren.length,
        1,
        "discovery should add exactly one chunk entity to the root",
    );
    return { harness, chunkEntity: newChildren[0] };
}

describe("discover generates chunk", () => {
    it("registers the chunk and places the chunk entity at the chunk's world origin", () => {
        const { harness, chunkEntity } = discoverChunk();

        const tiles = harness.root.requireEcsComponent(TileComponentId);
        assert.ok(
            hasChunk(tiles, chunkPosition),
            "generated chunk should be registered in the tile component",
        );
        assert.deepStrictEqual(chunkEntity.worldPosition, {
            x: chunkPosition.x * ChunkSize,
            y: chunkPosition.y * ChunkSize,
        });

        const worldDiscovery = harness.root.requireEcsComponent(
            WorldDiscoveryComponentId,
        );
        assert.ok(
            hasDiscoveredTile(worldDiscovery, "player", discoveredPoint),
            "the discovered tile should be marked as discovered",
        );
    });

    it("keeps transforms consistent across the generated entity tree", () => {
        const { harness } = discoverChunk();

        assertTransformsConsistent(harness.root);
    });

    it("indexes the generated entities in the chunk map", () => {
        const { harness } = discoverChunk();

        assertChunkMapMatchesTree(harness.root);
    });

    it("places a goblin camp with its footprint inside the discovered chunk", () => {
        const { harness, chunkEntity } = discoverChunk();

        const camps = harness.root.queryComponents(GoblinCampComponentId);
        assert.strictEqual(
            camps.size,
            1,
            "discovering the first chunk outside the start biome should place one camp",
        );

        const camp = [...camps.keys()][0];
        assert.strictEqual(
            camp.parent,
            chunkEntity,
            "the camp should be parented to the generated chunk entity",
        );

        const bounds = getChunkBounds(chunkPosition);
        for (const member of [camp, ...camp.children]) {
            const world = member.worldPosition;
            assert.ok(
                world.x >= bounds.x1 &&
                    world.x <= bounds.x2 &&
                    world.y >= bounds.y1 &&
                    world.y <= bounds.y2,
                `${member.id} at (${world.x},${world.y}) should be inside the chunk bounds`,
            );
        }
    });
});

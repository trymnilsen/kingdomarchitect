import assert from "node:assert";
import { describe, it } from "node:test";
import { generateChunk } from "../../../src/game/map/chunkGenerator.ts";
import { ChunkSize } from "../../../src/game/map/chunk.ts";
import type { Volume } from "../../../src/game/map/volume.ts";
import {
    TileComponentId,
    setChunk,
} from "../../../src/game/component/tileComponent.ts";
import { createMinimalWorld } from "../testWorld.ts";
import {
    assertChunkMapMatchesTree,
    assertTransformsConsistent,
} from "../worldInvariants.ts";

/**
 * generateChunk mixes deterministic volume rules with random volume sizes,
 * types, and biome contents. These tests pin the deterministic branches
 * (start-biome expansion, the no-adjacent-volume fallback) and the
 * structural invariants that must hold for any random outcome.
 */

function startVolume(maxSize: number): Volume {
    return {
        id: "start-volume",
        maxSize,
        type: "forrest",
        chunks: [{ x: 0, y: 0 }],
        debugColor: "#ffffff",
        isStartBiome: true,
    };
}

describe("generateChunk", () => {
    it("always expands an adjacent start-biome volume with space", () => {
        const { root } = createMinimalWorld();
        const tiles = root.requireEcsComponent(TileComponentId);
        const volume = startVolume(2);
        setChunk(tiles, { chunkX: 0, chunkY: 0, volume });

        const generated = generateChunk(root, { x: 1, y: 0 });

        assert.strictEqual(
            generated.chunk.volume,
            volume,
            "the new chunk should join the start-biome volume",
        );
        assert.deepStrictEqual(volume.chunks, [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
        ]);
    });

    it("does not expand a full start-biome volume", () => {
        const { root } = createMinimalWorld();
        const tiles = root.requireEcsComponent(TileComponentId);
        const volume = startVolume(1);
        setChunk(tiles, { chunkX: 0, chunkY: 0, volume });

        const generated = generateChunk(root, { x: 1, y: 0 });

        assert.notStrictEqual(
            generated.chunk.volume.id,
            volume.id,
            "a full start volume should not receive new chunks",
        );
        assert.deepStrictEqual(volume.chunks, [{ x: 0, y: 0 }]);
    });

    it("creates a new volume holding the chunk when no adjacent volume exists", () => {
        const { root } = createMinimalWorld();

        const generated = generateChunk(root, { x: 1, y: 0 });

        const volume = generated.chunk.volume;
        assert.ok(volume.id, "the new volume should have an id");
        assert.deepStrictEqual(volume.chunks, [{ x: 1, y: 0 }]);
        assert.ok(
            volume.maxSize >= 1,
            "the new volume should allow at least its own chunk",
        );
    });

    it("places the chunk entity at the chunk's world origin with consistent contents", () => {
        const { root } = createMinimalWorld();

        const generated = generateChunk(root, { x: 1, y: 1 });

        assert.strictEqual(generated.chunkEntity.parent, root);
        assert.deepStrictEqual(generated.chunkEntity.worldPosition, {
            x: ChunkSize,
            y: ChunkSize,
        });
        assertTransformsConsistent(root);
        assertChunkMapMatchesTree(root);
    });
});

import assert from "node:assert";
import { describe, it } from "node:test";
import { encodePosition, makeNumberId } from "../../../src/common/point.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../src/game/component/tileComponent.ts";
import type { WorldDiscoveryData } from "../../../src/game/component/worldDiscoveryComponent.ts";
import { ChunkSize } from "../../../src/game/map/chunk.ts";
import type { Volume } from "../../../src/game/map/volume.ts";
import { getPlayerDiscoveryData } from "../../../src/server/message/playerDiscoveryData.ts";

function createTestVolume(id: string): Volume {
    return {
        id,
        type: "plains",
        debugColor: "#8dd66d",
        maxSize: 64,
        chunks: [],
    };
}

describe("playerDiscoveryData", () => {
    describe("getPlayerDiscoveryData", () => {
        it("returns null when no tiles discovered", () => {
            const tileComponent = createTileComponent();
            const playerDiscovery: WorldDiscoveryData = {
                fullyDiscoveredChunks: new Set(),
                partiallyDiscoveredChunks: new Map(),
            };

            const result = getPlayerDiscoveryData(
                tileComponent,
                playerDiscovery,
            );

            assert.strictEqual(result, null);
        });

        it("extracts all 64 tiles from a fully discovered chunk", () => {
            const tileComponent = createTileComponent();
            const volume = createTestVolume("vol1");
            tileComponent.volume.set(volume.id, volume);

            setChunk(tileComponent, {
                chunkX: 0,
                chunkY: 0,
                volume: volume,
            });

            const chunkId = encodePosition(0, 0);
            const playerDiscovery: WorldDiscoveryData = {
                fullyDiscoveredChunks: new Set([chunkId]),
                partiallyDiscoveredChunks: new Map(),
            };

            const result = getPlayerDiscoveryData(
                tileComponent,
                playerDiscovery,
            );

            assert.ok(result, "Should return discovery data");
            assert.strictEqual(
                result.tiles.length,
                ChunkSize * ChunkSize,
                "Should have 64 tiles for a fully discovered chunk",
            );

            // Verify tiles are in the correct positions (0-7, 0-7 for chunk at 0,0)
            const tilePositions = new Set(
                result.tiles.map((t) => `${t.x},${t.y}`),
            );
            for (let x = 0; x < ChunkSize; x++) {
                for (let y = 0; y < ChunkSize; y++) {
                    assert.ok(
                        tilePositions.has(`${x},${y}`),
                        `Should have tile at ${x},${y}`,
                    );
                }
            }

            // Verify volume reference
            for (const tile of result.tiles) {
                assert.strictEqual(tile.volume, "vol1");
            }
        });

        it("extracts all 64 tiles from fully discovered chunk at non-zero position", () => {
            const tileComponent = createTileComponent();
            const volume = createTestVolume("vol1");
            tileComponent.volume.set(volume.id, volume);

            // Chunk at position (2, 3)
            setChunk(tileComponent, {
                chunkX: 2,
                chunkY: 3,
                volume: volume,
            });

            const chunkId = encodePosition(2, 3);
            const playerDiscovery: WorldDiscoveryData = {
                fullyDiscoveredChunks: new Set([chunkId]),
                partiallyDiscoveredChunks: new Map(),
            };

            const result = getPlayerDiscoveryData(
                tileComponent,
                playerDiscovery,
            );

            assert.ok(result, "Should return discovery data");
            assert.strictEqual(result.tiles.length, ChunkSize * ChunkSize);

            // Tiles should be at world positions (16-23, 24-31) for chunk at (2, 3)
            const chunkStartX = 2 * ChunkSize;
            const chunkStartY = 3 * ChunkSize;
            const tilePositions = new Set(
                result.tiles.map((t) => `${t.x},${t.y}`),
            );
            for (let x = 0; x < ChunkSize; x++) {
                for (let y = 0; y < ChunkSize; y++) {
                    assert.ok(
                        tilePositions.has(
                            `${chunkStartX + x},${chunkStartY + y}`,
                        ),
                        `Should have tile at ${chunkStartX + x},${chunkStartY + y}`,
                    );
                }
            }
        });

        it("extracts only specific tiles from partially discovered chunks", () => {
            const tileComponent = createTileComponent();
            const volume = createTestVolume("vol1");
            tileComponent.volume.set(volume.id, volume);

            setChunk(tileComponent, {
                chunkX: 0,
                chunkY: 0,
                volume: volume,
            });

            const chunkId = encodePosition(0, 0);
            // Discover only tiles at local positions (0,0), (1,1), (2,2)
            const discoveredTiles = new Set([
                makeNumberId(0, 0),
                makeNumberId(1, 1),
                makeNumberId(2, 2),
            ]);

            const playerDiscovery: WorldDiscoveryData = {
                fullyDiscoveredChunks: new Set(),
                partiallyDiscoveredChunks: new Map([[chunkId, discoveredTiles]]),
            };

            const result = getPlayerDiscoveryData(
                tileComponent,
                playerDiscovery,
            );

            assert.ok(result, "Should return discovery data");
            assert.strictEqual(
                result.tiles.length,
                3,
                "Should have exactly 3 tiles",
            );

            const tilePositions = new Set(
                result.tiles.map((t) => `${t.x},${t.y}`),
            );
            assert.ok(tilePositions.has("0,0"), "Should have tile at 0,0");
            assert.ok(tilePositions.has("1,1"), "Should have tile at 1,1");
            assert.ok(tilePositions.has("2,2"), "Should have tile at 2,2");
        });

        it("collects referenced volumes correctly", () => {
            const tileComponent = createTileComponent();
            const volume1 = createTestVolume("vol1");
            const volume2 = createTestVolume("vol2");
            tileComponent.volume.set(volume1.id, volume1);
            tileComponent.volume.set(volume2.id, volume2);

            setChunk(tileComponent, {
                chunkX: 0,
                chunkY: 0,
                volume: volume1,
            });

            setChunk(tileComponent, {
                chunkX: 1,
                chunkY: 0,
                volume: volume2,
            });

            const chunk0Id = encodePosition(0, 0);
            const chunk1Id = encodePosition(1, 0);

            const playerDiscovery: WorldDiscoveryData = {
                fullyDiscoveredChunks: new Set([chunk0Id, chunk1Id]),
                partiallyDiscoveredChunks: new Map(),
            };

            const result = getPlayerDiscoveryData(
                tileComponent,
                playerDiscovery,
            );

            assert.ok(result, "Should return discovery data");
            assert.strictEqual(
                result.volumes.length,
                2,
                "Should include both volumes",
            );

            const volumeIds = new Set(result.volumes.map((v) => v.id));
            assert.ok(volumeIds.has("vol1"), "Should include volume1");
            assert.ok(volumeIds.has("vol2"), "Should include volume2");
        });

        it("does not duplicate volumes referenced by multiple chunks", () => {
            const tileComponent = createTileComponent();
            const volume = createTestVolume("shared-vol");
            tileComponent.volume.set(volume.id, volume);

            // Two chunks sharing the same volume
            setChunk(tileComponent, {
                chunkX: 0,
                chunkY: 0,
                volume: volume,
            });

            setChunk(tileComponent, {
                chunkX: 1,
                chunkY: 0,
                volume: volume,
            });

            const chunk0Id = encodePosition(0, 0);
            const chunk1Id = encodePosition(1, 0);

            const playerDiscovery: WorldDiscoveryData = {
                fullyDiscoveredChunks: new Set([chunk0Id, chunk1Id]),
                partiallyDiscoveredChunks: new Map(),
            };

            const result = getPlayerDiscoveryData(
                tileComponent,
                playerDiscovery,
            );

            assert.ok(result, "Should return discovery data");
            assert.strictEqual(
                result.volumes.length,
                1,
                "Should include volume only once",
            );
            assert.strictEqual(result.volumes[0].id, "shared-vol");
        });

        it("skips chunks without volume", () => {
            const tileComponent = createTileComponent();
            const volume = createTestVolume("vol1");
            tileComponent.volume.set(volume.id, volume);

            // Chunk with volume
            setChunk(tileComponent, {
                chunkX: 0,
                chunkY: 0,
                volume: volume,
            });

            // Chunk without volume (shouldn't happen in practice but test the guard)
            setChunk(tileComponent, {
                chunkX: 1,
                chunkY: 0,
                // no volume
            });

            const chunk0Id = encodePosition(0, 0);
            const chunk1Id = encodePosition(1, 0);

            const playerDiscovery: WorldDiscoveryData = {
                fullyDiscoveredChunks: new Set([chunk0Id, chunk1Id]),
                partiallyDiscoveredChunks: new Map(),
            };

            const result = getPlayerDiscoveryData(
                tileComponent,
                playerDiscovery,
            );

            assert.ok(result, "Should return discovery data");
            // Should only have tiles from chunk 0 since chunk 1 has no volume
            assert.strictEqual(result.tiles.length, ChunkSize * ChunkSize);
            assert.strictEqual(result.volumes.length, 1);
        });

        it("combines fully and partially discovered chunks", () => {
            const tileComponent = createTileComponent();
            const volume = createTestVolume("vol1");
            tileComponent.volume.set(volume.id, volume);

            setChunk(tileComponent, {
                chunkX: 0,
                chunkY: 0,
                volume: volume,
            });

            setChunk(tileComponent, {
                chunkX: 1,
                chunkY: 0,
                volume: volume,
            });

            const chunk0Id = encodePosition(0, 0);
            const chunk1Id = encodePosition(1, 0);

            // One tile discovered in chunk 1
            const discoveredTiles = new Set([makeNumberId(0, 0)]);

            const playerDiscovery: WorldDiscoveryData = {
                fullyDiscoveredChunks: new Set([chunk0Id]),
                partiallyDiscoveredChunks: new Map([[chunk1Id, discoveredTiles]]),
            };

            const result = getPlayerDiscoveryData(
                tileComponent,
                playerDiscovery,
            );

            assert.ok(result, "Should return discovery data");
            // 64 from fully discovered + 1 from partially discovered
            assert.strictEqual(result.tiles.length, ChunkSize * ChunkSize + 1);
        });
    });
});

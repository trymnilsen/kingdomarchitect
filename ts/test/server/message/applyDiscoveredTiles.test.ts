import assert from "node:assert";
import { describe, it } from "node:test";
import { makeNumberId } from "../../../src/common/point.ts";
import {
    createTileComponent,
    type TileComponent,
} from "../../../src/game/component/tileComponent.ts";
import {
    createVisibilityMapComponent,
    type VisibilityMapComponent,
} from "../../../src/game/component/visibilityMapComponent.ts";
import { ChunkSize, getChunkId } from "../../../src/game/map/chunk.ts";
import type { Volume } from "../../../src/game/map/volume.ts";
import { applyDiscoveredTiles } from "../../../src/server/message/applyDiscoveredTiles.ts";
import type { DiscoveredTileData } from "../../../src/server/message/playerDiscoveryData.ts";

function createTestVolume(id: string): Volume {
    return {
        id,
        type: "plains",
        debugColor: "#8dd66d",
        maxSize: 64,
        chunks: [],
    };
}

describe("applyDiscoveredTiles", () => {
    describe("volume registration", () => {
        it("registers volumes in tileComponent.volume", () => {
            const tileComponent = createTileComponent();
            const visibilityMapComponent = createVisibilityMapComponent();

            const volume1 = createTestVolume("vol1");
            const volume2 = createTestVolume("vol2");

            const tiles: DiscoveredTileData[] = [
                { x: 0, y: 0, volume: "vol1" },
                { x: 8, y: 0, volume: "vol2" },
            ];

            applyDiscoveredTiles(
                tileComponent,
                visibilityMapComponent,
                tiles,
                [volume1, volume2],
            );

            assert.ok(
                tileComponent.volume.has("vol1"),
                "Should register vol1",
            );
            assert.ok(
                tileComponent.volume.has("vol2"),
                "Should register vol2",
            );
            assert.strictEqual(
                tileComponent.volume.get("vol1"),
                volume1,
                "Should be the same volume object",
            );
        });
    });

    describe("chunk creation", () => {
        it("creates chunks on demand when tile references unknown chunk", () => {
            const tileComponent = createTileComponent();
            const visibilityMapComponent = createVisibilityMapComponent();

            const volume = createTestVolume("vol1");

            const tiles: DiscoveredTileData[] = [{ x: 5, y: 3, volume: "vol1" }];

            assert.strictEqual(
                tileComponent.chunks.size,
                0,
                "Should start with no chunks",
            );

            applyDiscoveredTiles(tileComponent, visibilityMapComponent, tiles, [
                volume,
            ]);

            const chunkId = getChunkId({ x: 0, y: 0 });
            const chunk = tileComponent.chunks.get(chunkId);

            assert.ok(chunk, "Should create chunk for tile");
            assert.strictEqual(chunk.chunkX, 0);
            assert.strictEqual(chunk.chunkY, 0);
            assert.strictEqual(chunk.volume, volume);
        });

        it("creates chunk at correct position for tiles in non-zero chunk", () => {
            const tileComponent = createTileComponent();
            const visibilityMapComponent = createVisibilityMapComponent();

            const volume = createTestVolume("vol1");

            // Tile at (20, 30) should be in chunk (2, 3)
            const tiles: DiscoveredTileData[] = [
                { x: 20, y: 30, volume: "vol1" },
            ];

            applyDiscoveredTiles(tileComponent, visibilityMapComponent, tiles, [
                volume,
            ]);

            const chunkId = getChunkId({ x: 2, y: 3 });
            const chunk = tileComponent.chunks.get(chunkId);

            assert.ok(chunk, "Should create chunk at (2,3)");
            assert.strictEqual(chunk.chunkX, 2);
            assert.strictEqual(chunk.chunkY, 3);
        });

        it("adds chunk position to volume.chunks when creating chunk", () => {
            const tileComponent = createTileComponent();
            const visibilityMapComponent = createVisibilityMapComponent();

            const volume = createTestVolume("vol1");

            const tiles: DiscoveredTileData[] = [{ x: 5, y: 3, volume: "vol1" }];

            applyDiscoveredTiles(tileComponent, visibilityMapComponent, tiles, [
                volume,
            ]);

            assert.strictEqual(volume.chunks.length, 1);
            assert.deepStrictEqual(volume.chunks[0], { x: 0, y: 0 });
        });

        it("does not duplicate chunk position in volume when applying multiple tiles", () => {
            const tileComponent = createTileComponent();
            const visibilityMapComponent = createVisibilityMapComponent();

            const volume = createTestVolume("vol1");

            // Multiple tiles in the same chunk
            const tiles: DiscoveredTileData[] = [
                { x: 0, y: 0, volume: "vol1" },
                { x: 1, y: 1, volume: "vol1" },
                { x: 2, y: 2, volume: "vol1" },
            ];

            applyDiscoveredTiles(tileComponent, visibilityMapComponent, tiles, [
                volume,
            ]);

            assert.strictEqual(
                volume.chunks.length,
                1,
                "Should only add chunk position once",
            );
        });

        it("reuses existing chunk when present", () => {
            const tileComponent = createTileComponent();
            const visibilityMapComponent = createVisibilityMapComponent();

            const volume = createTestVolume("vol1");
            tileComponent.volume.set(volume.id, volume);

            // Pre-create the chunk
            const existingChunk = {
                chunkX: 0,
                chunkY: 0,
                volume: volume,
            };
            tileComponent.chunks.set(
                getChunkId({ x: 0, y: 0 }),
                existingChunk,
            );

            const tiles: DiscoveredTileData[] = [{ x: 3, y: 3, volume: "vol1" }];

            applyDiscoveredTiles(tileComponent, visibilityMapComponent, tiles, [
                volume,
            ]);

            assert.strictEqual(
                tileComponent.chunks.size,
                1,
                "Should not create additional chunk",
            );
            assert.strictEqual(
                tileComponent.chunks.get(getChunkId({ x: 0, y: 0 })),
                existingChunk,
                "Should be the same chunk object",
            );
        });
    });

    describe("visibility tracking", () => {
        it("tracks partial discovery in partiallyDiscoveredChunks", () => {
            const tileComponent = createTileComponent();
            const visibilityMapComponent = createVisibilityMapComponent();

            const volume = createTestVolume("vol1");

            const tiles: DiscoveredTileData[] = [
                { x: 0, y: 0, volume: "vol1" },
                { x: 1, y: 1, volume: "vol1" },
            ];

            applyDiscoveredTiles(tileComponent, visibilityMapComponent, tiles, [
                volume,
            ]);

            const chunkId = makeNumberId(0, 0);
            const partiallyDiscovered =
                visibilityMapComponent.discovered.partiallyDiscoveredChunks.get(
                    chunkId,
                );

            assert.ok(partiallyDiscovered, "Should have partial discovery data");
            assert.ok(
                partiallyDiscovered.has(makeNumberId(0, 0)),
                "Should track tile at (0,0)",
            );
            assert.ok(
                partiallyDiscovered.has(makeNumberId(1, 1)),
                "Should track tile at (1,1)",
            );
            assert.strictEqual(partiallyDiscovered.size, 2);

            assert.ok(
                !visibilityMapComponent.discovered.fullyDiscoveredChunks.has(
                    chunkId,
                ),
                "Should not be fully discovered",
            );
        });

        it("promotes chunk to fullyDiscoveredChunks when all 64 tiles added", () => {
            const tileComponent = createTileComponent();
            const visibilityMapComponent = createVisibilityMapComponent();

            const volume = createTestVolume("vol1");

            // Create all 64 tiles in a chunk
            const tiles: DiscoveredTileData[] = [];
            for (let x = 0; x < ChunkSize; x++) {
                for (let y = 0; y < ChunkSize; y++) {
                    tiles.push({ x, y, volume: "vol1" });
                }
            }

            applyDiscoveredTiles(tileComponent, visibilityMapComponent, tiles, [
                volume,
            ]);

            const chunkId = makeNumberId(0, 0);

            assert.ok(
                visibilityMapComponent.discovered.fullyDiscoveredChunks.has(
                    chunkId,
                ),
                "Should be fully discovered",
            );
            assert.ok(
                !visibilityMapComponent.discovered.partiallyDiscoveredChunks.has(
                    chunkId,
                ),
                "Should not be in partially discovered",
            );
        });

        it("correctly handles promotion from 63 to 64 tiles", () => {
            const tileComponent = createTileComponent();
            const visibilityMapComponent = createVisibilityMapComponent();

            const volume = createTestVolume("vol1");

            // Add 63 tiles first
            const tiles63: DiscoveredTileData[] = [];
            for (let x = 0; x < ChunkSize; x++) {
                for (let y = 0; y < ChunkSize; y++) {
                    if (x === 7 && y === 7) continue; // Skip last tile
                    tiles63.push({ x, y, volume: "vol1" });
                }
            }

            applyDiscoveredTiles(
                tileComponent,
                visibilityMapComponent,
                tiles63,
                [volume],
            );

            const chunkId = makeNumberId(0, 0);

            assert.ok(
                !visibilityMapComponent.discovered.fullyDiscoveredChunks.has(
                    chunkId,
                ),
                "Should not be fully discovered with 63 tiles",
            );
            assert.ok(
                visibilityMapComponent.discovered.partiallyDiscoveredChunks.has(
                    chunkId,
                ),
                "Should be partially discovered",
            );

            // Add the final tile
            applyDiscoveredTiles(
                tileComponent,
                visibilityMapComponent,
                [{ x: 7, y: 7, volume: "vol1" }],
                [volume],
            );

            assert.ok(
                visibilityMapComponent.discovered.fullyDiscoveredChunks.has(
                    chunkId,
                ),
                "Should be fully discovered after adding 64th tile",
            );
            assert.ok(
                !visibilityMapComponent.discovered.partiallyDiscoveredChunks.has(
                    chunkId,
                ),
                "Should remove from partially discovered",
            );
        });

        it("handles tiles with negative coordinates correctly", () => {
            const tileComponent = createTileComponent();
            const visibilityMapComponent = createVisibilityMapComponent();

            const volume = createTestVolume("vol1");

            // Tile at (-5, -3) should be in chunk (-1, -1) with local coords (3, 5)
            // Because -5 % 8 = -5, normalized: (-5 + 8) % 8 = 3
            // And -3 % 8 = -3, normalized: (-3 + 8) % 8 = 5
            const tiles: DiscoveredTileData[] = [
                { x: -5, y: -3, volume: "vol1" },
            ];

            applyDiscoveredTiles(tileComponent, visibilityMapComponent, tiles, [
                volume,
            ]);

            const chunkId = makeNumberId(-1, -1);
            const partiallyDiscovered =
                visibilityMapComponent.discovered.partiallyDiscoveredChunks.get(
                    chunkId,
                );

            assert.ok(
                partiallyDiscovered,
                "Should have partial discovery for negative chunk",
            );
            // Local position for -5 in chunk -1 (which covers -8 to -1) is: -5 - (-8) = 3
            // Local position for -3 in chunk -1 is: -3 - (-8) = 5
            assert.ok(
                partiallyDiscovered.has(makeNumberId(3, 5)),
                "Should track tile at local (3,5)",
            );
        });
    });

    describe("edge cases", () => {
        it("warns and skips tile when volume is not found", () => {
            const tileComponent = createTileComponent();
            const visibilityMapComponent = createVisibilityMapComponent();

            // Tile references a volume not in the volumes array
            const tiles: DiscoveredTileData[] = [
                { x: 0, y: 0, volume: "nonexistent" },
            ];

            // Should not throw
            applyDiscoveredTiles(tileComponent, visibilityMapComponent, tiles, []);

            // Chunk should not be created
            assert.strictEqual(tileComponent.chunks.size, 0);
        });

        it("handles empty tiles array", () => {
            const tileComponent = createTileComponent();
            const visibilityMapComponent = createVisibilityMapComponent();

            applyDiscoveredTiles(tileComponent, visibilityMapComponent, [], []);

            assert.strictEqual(tileComponent.chunks.size, 0);
            assert.strictEqual(tileComponent.volume.size, 0);
        });

        it("handles multiple chunks in single call", () => {
            const tileComponent = createTileComponent();
            const visibilityMapComponent = createVisibilityMapComponent();

            const volume = createTestVolume("vol1");

            // Tiles in 3 different chunks
            const tiles: DiscoveredTileData[] = [
                { x: 0, y: 0, volume: "vol1" }, // chunk (0, 0)
                { x: 10, y: 0, volume: "vol1" }, // chunk (1, 0)
                { x: 0, y: 16, volume: "vol1" }, // chunk (0, 2)
            ];

            applyDiscoveredTiles(tileComponent, visibilityMapComponent, tiles, [
                volume,
            ]);

            assert.strictEqual(tileComponent.chunks.size, 3);
            assert.ok(tileComponent.chunks.has(getChunkId({ x: 0, y: 0 })));
            assert.ok(tileComponent.chunks.has(getChunkId({ x: 1, y: 0 })));
            assert.ok(tileComponent.chunks.has(getChunkId({ x: 0, y: 2 })));
        });
    });
});

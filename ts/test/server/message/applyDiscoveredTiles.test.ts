import assert from "node:assert";
import { describe, it } from "node:test";
import { encodePosition, type Point } from "../../../src/common/point.ts";
import {
    createTileComponent,
    setChunk,
    type TileComponent,
} from "../../../src/game/component/tileComponent.ts";
import { createVisibilityMapComponent } from "../../../src/game/component/visibilityMapComponent.ts";
import { ChunkSize, createLandTerrain } from "../../../src/game/map/chunk.ts";
import type { Volume } from "../../../src/game/map/volume.ts";
import { applyDiscoveredTiles } from "../../../src/server/message/applyDiscoveredTiles.ts";

const volume: Volume = {
    id: "vol1",
    type: "plains",
    debugColor: "#8dd66d",
    maxSize: 64,
    chunks: [],
};

function createTilesWithGround(...chunks: Point[]): TileComponent {
    const tileComponent = createTileComponent();
    for (const chunk of chunks) {
        setChunk(tileComponent, {
            chunkX: chunk.x,
            chunkY: chunk.y,
            volume,
            terrain: createLandTerrain(),
        });
    }
    return tileComponent;
}

function allTilesOfChunk(chunk: Point): Point[] {
    const tiles: Point[] = [];
    for (let x = 0; x < ChunkSize; x++) {
        for (let y = 0; y < ChunkSize; y++) {
            tiles.push({
                x: chunk.x * ChunkSize + x,
                y: chunk.y * ChunkSize + y,
            });
        }
    }
    return tiles;
}

function worldTile(chunk: Point, localX: number, localY: number): Point {
    return {
        x: chunk.x * ChunkSize + localX,
        y: chunk.y * ChunkSize + localY,
    };
}

describe("applyDiscoveredTiles", () => {
    const chunk = { x: 2, y: 1 };
    const chunkId = encodePosition(chunk.x, chunk.y);

    it("tracks discovered tiles in chunk local coordinates", () => {
        const tileComponent = createTilesWithGround(chunk);
        const visibilityMapComponent = createVisibilityMapComponent();

        applyDiscoveredTiles(tileComponent, visibilityMapComponent, [
            worldTile(chunk, 3, 3),
            worldTile(chunk, 6, 6),
        ]);

        const partiallyDiscovered =
            visibilityMapComponent.discovered.partiallyDiscoveredChunks.get(
                chunkId,
            );
        assert.ok(partiallyDiscovered);
        assert.deepStrictEqual(
            [...partiallyDiscovered].sort(),
            [encodePosition(3, 3), encodePosition(6, 6)].sort(),
        );
        assert.ok(
            !visibilityMapComponent.discovered.fullyDiscoveredChunks.has(
                chunkId,
            ),
        );
    });

    it("promotes a chunk to fully discovered on its last tile", () => {
        const tileComponent = createTilesWithGround(chunk);
        const visibilityMapComponent = createVisibilityMapComponent();
        const tiles = allTilesOfChunk(chunk);
        const lastTile = tiles.pop()!;

        applyDiscoveredTiles(tileComponent, visibilityMapComponent, tiles);
        assert.ok(
            visibilityMapComponent.discovered.partiallyDiscoveredChunks.has(
                chunkId,
            ),
        );
        assert.ok(
            !visibilityMapComponent.discovered.fullyDiscoveredChunks.has(
                chunkId,
            ),
        );

        applyDiscoveredTiles(tileComponent, visibilityMapComponent, [lastTile]);
        assert.ok(
            visibilityMapComponent.discovered.fullyDiscoveredChunks.has(
                chunkId,
            ),
        );
        assert.ok(
            !visibilityMapComponent.discovered.partiallyDiscoveredChunks.has(
                chunkId,
            ),
        );
    });

    it("normalizes negative coordinates into the chunk", () => {
        const tileComponent = createTilesWithGround({ x: -1, y: -1 });
        const visibilityMapComponent = createVisibilityMapComponent();

        applyDiscoveredTiles(tileComponent, visibilityMapComponent, [
            { x: -5, y: -3 },
        ]);

        const partiallyDiscovered =
            visibilityMapComponent.discovered.partiallyDiscoveredChunks.get(
                encodePosition(-1, -1),
            );
        assert.ok(partiallyDiscovered);
        assert.ok(
            partiallyDiscovered.has(
                encodePosition(ChunkSize - 5, ChunkSize - 3),
            ),
        );
    });

    it("skips tiles in chunks without replicated ground", () => {
        const tileComponent = createTilesWithGround(chunk);
        const visibilityMapComponent = createVisibilityMapComponent();

        const chunkWithoutGround = { x: 5, y: 3 };
        applyDiscoveredTiles(tileComponent, visibilityMapComponent, [
            worldTile(chunk, 3, 3),
            worldTile(chunkWithoutGround, 3, 3),
        ]);

        assert.ok(
            visibilityMapComponent.discovered.partiallyDiscoveredChunks.has(
                chunkId,
            ),
        );
        assert.ok(
            !visibilityMapComponent.discovered.partiallyDiscoveredChunks.has(
                encodePosition(chunkWithoutGround.x, chunkWithoutGround.y),
            ),
            "No visibility is tracked for a chunk the client has no ground for",
        );
        assert.strictEqual(
            tileComponent.chunks.size,
            1,
            "Discovering a tile never invents a chunk",
        );
    });
});

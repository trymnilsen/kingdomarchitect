import assert from "node:assert";
import { describe, it } from "node:test";
import { encodePosition, type Point } from "../../../src/common/point.ts";
import type { WorldDiscoveryData } from "../../../src/game/component/worldDiscoveryComponent.ts";
import { ChunkSize } from "../../../src/game/map/chunk.ts";
import { getPlayerDiscoveredTiles } from "../../../src/server/message/playerDiscoveredTiles.ts";

function sortTiles(tiles: Point[]): Point[] {
    return [...tiles].sort((a, b) => a.x - b.x || a.y - b.y);
}

describe("getPlayerDiscoveredTiles", () => {
    it("lists every tile of a fully discovered chunk in world coordinates", () => {
        const chunk = { x: 2, y: -1 };
        const discovery: WorldDiscoveryData = {
            fullyDiscoveredChunks: new Set([encodePosition(chunk.x, chunk.y)]),
            partiallyDiscoveredChunks: new Map(),
        };

        const tiles = getPlayerDiscoveredTiles(discovery);

        assert.strictEqual(tiles.length, ChunkSize * ChunkSize);
        for (const tile of tiles) {
            assert.ok(
                tile.x >= chunk.x * ChunkSize &&
                    tile.x < (chunk.x + 1) * ChunkSize &&
                    tile.y >= chunk.y * ChunkSize &&
                    tile.y < (chunk.y + 1) * ChunkSize,
                `tile ${tile.x},${tile.y} is outside chunk ${chunk.x},${chunk.y}`,
            );
        }
        assert.strictEqual(
            new Set(tiles.map((tile) => encodePosition(tile.x, tile.y))).size,
            tiles.length,
            "every tile is listed once",
        );
    });

    it("turns the chunk local tiles of a partial chunk into world tiles", () => {
        const discovery: WorldDiscoveryData = {
            fullyDiscoveredChunks: new Set(),
            partiallyDiscoveredChunks: new Map([
                [
                    encodePosition(-1, 3),
                    new Set([
                        encodePosition(2, 5),
                        encodePosition(ChunkSize - 1, 0),
                    ]),
                ],
            ]),
        };

        assert.deepStrictEqual(
            sortTiles(getPlayerDiscoveredTiles(discovery)),
            sortTiles([
                { x: -ChunkSize + 2, y: 3 * ChunkSize + 5 },
                { x: -1, y: 3 * ChunkSize },
            ]),
        );
    });

    it("combines full and partial chunks", () => {
        const discovery: WorldDiscoveryData = {
            fullyDiscoveredChunks: new Set([encodePosition(4, 1)]),
            partiallyDiscoveredChunks: new Map([
                [encodePosition(5, 1), new Set([encodePosition(3, 6)])],
            ]),
        };

        const tiles = getPlayerDiscoveredTiles(discovery);

        assert.strictEqual(tiles.length, ChunkSize * ChunkSize + 1);
        assert.ok(
            tiles.some(
                (tile) =>
                    tile.x === 5 * ChunkSize + 3 && tile.y === ChunkSize + 6,
            ),
        );
    });
});

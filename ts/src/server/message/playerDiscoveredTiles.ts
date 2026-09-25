import { decodePosition, type Point } from "../../common/point.ts";
import type { WorldDiscoveryData } from "../../game/component/worldDiscoveryComponent.ts";
import { ChunkSize } from "../../game/map/chunk.ts";

export function getPlayerDiscoveredTiles(
    playerDiscovery: WorldDiscoveryData,
): Point[] {
    const tiles: Point[] = [];

    for (const chunkId of playerDiscovery.fullyDiscoveredChunks) {
        const chunk = decodePosition(chunkId);
        for (let x = 0; x < ChunkSize; x++) {
            for (let y = 0; y < ChunkSize; y++) {
                tiles.push({
                    x: chunk.x * ChunkSize + x,
                    y: chunk.y * ChunkSize + y,
                });
            }
        }
    }

    for (const [
        chunkId,
        discoveredTiles,
    ] of playerDiscovery.partiallyDiscoveredChunks) {
        const chunk = decodePosition(chunkId);
        for (const tileId of discoveredTiles) {
            const local = decodePosition(tileId);
            tiles.push({
                x: chunk.x * ChunkSize + local.x,
                y: chunk.y * ChunkSize + local.y,
            });
        }
    }

    return tiles;
}

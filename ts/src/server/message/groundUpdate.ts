import { log } from "../../common/logging/logger.ts";
import { pointEquals, type Point } from "../../common/point.ts";
import {
    getChunk,
    setChunk,
    type TileComponent,
} from "../../game/component/tileComponent.ts";
import type { VisibilityMapComponent } from "../../game/component/visibilityMapComponent.ts";
import type { TileChunk } from "../../game/map/chunk.ts";
import type { Volume } from "../../game/map/volume.ts";
import { applyDiscoveredTiles } from "./applyDiscoveredTiles.ts";
import {
    GroundUpdateGameMessageType,
    type GroundUpdate,
    type GroundUpdateGameMessage,
    type ReplicatedChunkData,
} from "./gameMessage.ts";

export function buildGroundUpdate(
    chunks: Iterable<TileChunk>,
    discoveredTiles: Point[],
): GroundUpdate {
    const volumes = new Map<string, Volume>();
    const replicatedChunks: ReplicatedChunkData[] = [];
    for (const chunk of chunks) {
        if (!chunk.volume) {
            continue;
        }
        volumes.set(chunk.volume.id, chunk.volume);
        replicatedChunks.push({
            chunkX: chunk.chunkX,
            chunkY: chunk.chunkY,
            volume: chunk.volume.id,
            // not copied since terrain never changes and the local client can share it
            terrain: chunk.terrain,
        });
    }

    return {
        volumes: [...volumes.values()],
        chunks: replicatedChunks,
        discoveredTiles,
    };
}

export function buildGroundUpdateMessage(
    tileComponent: TileComponent,
    discoveredTiles: Point[],
    generatedChunks: readonly Point[],
): GroundUpdateGameMessage {
    const chunks: TileChunk[] = [];
    for (const position of generatedChunks) {
        const chunk = getChunk(tileComponent, position);
        if (chunk) {
            chunks.push(chunk);
        }
    }
    return {
        type: GroundUpdateGameMessageType,
        ground: buildGroundUpdate(chunks, discoveredTiles),
    };
}

export function applyGroundUpdate(
    tileComponent: TileComponent,
    visibilityMapComponent: VisibilityMapComponent,
    update: GroundUpdate,
): void {
    // volumes first since chunks look them up
    registerVolumes(tileComponent, update.volumes);
    registerChunks(tileComponent, update.chunks);
    // tiles last since they are skipped without a chunk
    applyDiscoveredTiles(
        tileComponent,
        visibilityMapComponent,
        update.discoveredTiles,
    );
}

function registerVolumes(
    tileComponent: TileComponent,
    volumes: readonly Volume[],
): void {
    for (const volume of volumes) {
        const existingVolume = tileComponent.volume.get(volume.id);
        if (existingVolume) {
            // update in place so chunks keep pointing at the same instance
            existingVolume.chunks = volume.chunks;
            existingVolume.maxSize = volume.maxSize;
        } else {
            tileComponent.volume.set(volume.id, volume);
        }
    }
}

function registerChunks(
    tileComponent: TileComponent,
    chunks: readonly ReplicatedChunkData[],
): void {
    for (const chunkData of chunks) {
        const volume = tileComponent.volume.get(chunkData.volume);
        if (!volume) {
            log.warn("No volume found for replicated chunk", {
                chunkX: chunkData.chunkX,
                chunkY: chunkData.chunkY,
                volume: chunkData.volume,
            });
            continue;
        }

        const chunkPosition = { x: chunkData.chunkX, y: chunkData.chunkY };
        const volumeHasChunk = volume.chunks.some((item) =>
            pointEquals(item, chunkPosition),
        );
        if (!volumeHasChunk) {
            volume.chunks.push(chunkPosition);
        }

        setChunk(tileComponent, {
            chunkX: chunkData.chunkX,
            chunkY: chunkData.chunkY,
            volume,
            terrain: chunkData.terrain,
        });
    }
}

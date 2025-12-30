import { makeNumberId, pointEquals } from "../../../common/point.ts";
import {
    createChunkMapRegistryComponent,
    createChunkMap,
} from "../../../game/component/chunkMapRegistryComponent.ts";
import {
    createPathfindingGraphRegistryComponent,
    createPathfindingGraph,
} from "../../../game/component/pathfindingGraphRegistryComponent.ts";
import {
    setChunk,
    TileComponentId,
} from "../../../game/component/tileComponent.ts";
import { VisibilityMapComponentId } from "../../../game/component/visibilityMapComponent.ts";
import type { Entity } from "../../../game/entity/entity.ts";
import {
    ChunkSize,
    getChunkId,
    getChunkPosition,
} from "../../../game/map/chunk.ts";
import { createLazyGraphFromRootNode } from "../../../game/map/path/graph/generateGraph.ts";
import { getOverworldEntity } from "../../../game/map/scenes.ts";
import type { Camera } from "../../../rendering/camera.ts";
import type { EffectGameMessage } from "../gameMessage.ts";
import {
    DiscoverTileEffectId,
    type DiscoverTileEffect,
} from "./discoverTileEffect.ts";
import { ReloadGameEffectId } from "./reloadGameEffect.ts";
import { SetSceneEffectId } from "./setSceneEffect.ts";

export function effectHandler(
    root: Entity,
    camera: Camera,
    message: EffectGameMessage,
) {
    switch (message.effect.id) {
        case DiscoverTileEffectId:
            discoverTileEffect(root, message.effect);
            break;
        case ReloadGameEffectId:
            window.location.reload();
            break;
        case SetSceneEffectId:
            const scene = root.findEntity(message.effect.entity);
            if (scene) {
                camera.currentScene = scene;
            }
            break;
        default:
            break;
    }
}

function discoverTileEffect(root: Entity, effect: DiscoverTileEffect) {
    const overworld = getOverworldEntity(root);
    const tileComponent = overworld.requireEcsComponent(TileComponentId);
    const visibilityMapComponent = overworld.requireEcsComponent(
        VisibilityMapComponentId,
    );

    if (effect.volumes) {
        for (const volume of effect.volumes) {
            tileComponent.volume.set(volume.id, volume);
        }
    }

    for (const tile of effect.tiles) {
        const volume = tileComponent.volume.get(tile.volume);
        if (!volume) {
            throw new Error(`No volume found for ${tile.x},${tile.y}`);
        }

        const chunkPosition = getChunkPosition(tile.x, tile.y);
        let chunk = tileComponent.chunks.get(getChunkId(chunkPosition));
        if (!chunk) {
            chunk = {
                chunkX: chunkPosition.x,
                chunkY: chunkPosition.y,
                volume: volume,
            };
            const volumeAlreadyHasChunk = volume.chunks.find((item) =>
                pointEquals(item, chunkPosition),
            );
            if (!volumeAlreadyHasChunk) {
                volume.chunks.push(chunkPosition);
            }
            setChunk(tileComponent, chunk);
        }

        //Javascript is a bit funky when it comes to modulus so we need
        //to do an extra round to ensure that the value is positive
        //as our local space within a chunk always goes from 0 -> 7
        const localX = ((tile.x % ChunkSize) + ChunkSize) % ChunkSize;
        const localY = ((tile.y % ChunkSize) + ChunkSize) % ChunkSize;

        const size = ChunkSize * ChunkSize;
        const chunkId = makeNumberId(chunkPosition.x, chunkPosition.y);
        let partiallyDiscoveredChunkData =
            visibilityMapComponent.discovered.partiallyDiscoveredChunks.get(
                chunkId,
            );
        if (!partiallyDiscoveredChunkData) {
            partiallyDiscoveredChunkData = new Set();
            visibilityMapComponent.discovered.partiallyDiscoveredChunks.set(
                chunkId,
                partiallyDiscoveredChunkData,
            );
        }

        if (partiallyDiscoveredChunkData.size < size - 1) {
            partiallyDiscoveredChunkData.add(makeNumberId(localX, localY));
        } else {
            visibilityMapComponent.discovered.partiallyDiscoveredChunks.delete(
                chunkId,
            );
            visibilityMapComponent.discovered.fullyDiscoveredChunks.add(
                chunkId,
            );
        }
    }
}

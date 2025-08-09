import type { EcsSystem } from "../../common/ecs/ecsSystem.js";
import { addInitialPlayerChunk } from "../map/player.js";
import type { Entity } from "../entity/entity.js";
import { EffectEmitterComponentId } from "../component/effectEmitterComponent.js";
import {
    discoverTile,
    hasDiscovered,
    hasDiscoveredChunkByChunkPosition,
    hasDiscoveredChunkByTilePosition,
    WorldDiscoveryComponentId,
} from "../component/worldDiscoveryComponent.js";
import {
    diamondPattern,
    generateDiamondPattern,
    offsetPatternWithPoint,
} from "../../common/pattern.js";
import type { DiscoverTileEffect } from "../../server/message/effect/discoverTileEffect.js";
import {
    getChunk,
    hasChunk,
    TileComponentId,
} from "../component/tileComponent.js";
import { pointEquals, type Point } from "../../common/point.js";
import { getChunkPosition } from "../map/chunk.js";
import { QueueJobCommandId } from "../../server/message/queueJobCommand.js";
import { getTileId } from "../map/tile.js";
import type { Volume } from "../map/volume.js";

export const worldGenerationSystem: EcsSystem = {
    onInit,
};

function onInit(root: Entity) {
    //TODO: Should send a set ChunkEvent
    const start = addInitialPlayerChunk(root);
    //Discover the tiles for the player, we should make this more dynamic
    const worldDiscovery = root.getEcsComponent(WorldDiscoveryComponentId);
    const pattern = offsetPatternWithPoint(start, generateDiamondPattern(5));
    setDiscoveryForPlayer(root, "player", pattern);
}

export function setDiscoveryForPlayer(
    root: Entity,
    player: string,
    discoveredPoints: Point[],
) {
    const effectEmitter = root.requireEcsComponent(EffectEmitterComponentId);
    const tileComponent = root.requireEcsComponent(TileComponentId);
    const worldDiscovery = root.requireEcsComponent(WorldDiscoveryComponentId);

    const chunksToGenerate: Point[] = [];
    const newPoints: { point: Point; volumeId: string }[] = [];
    const newVolumes: Volume[] = [];
    for (const point of discoveredPoints) {
        //Check if we need to generate the chunk
        const chunkPosition = getChunkPosition(point.x, point.y);
        if (
            !hasChunk(tileComponent, chunkPosition) &&
            !chunksToGenerate.some((item) => pointEquals(item, chunkPosition))
        ) {
            chunksToGenerate.push(chunkPosition);
        } else if (!hasDiscovered(worldDiscovery, player, point)) {
            const chunk = getChunk(tileComponent, chunkPosition);
            if (chunk?.volume) {
                newPoints.push({
                    point,
                    volumeId: chunk.volume.id,
                });
            }
            //Check if this is also a new chunk that exists but has not been discovered
            if (
                chunk &&
                !hasDiscoveredChunkByTilePosition(worldDiscovery, player, point)
            ) {
                //If the user has not discovered this chunk we need to check if
                //this is a new volume for the player
                const volume = chunk?.volume;
                if (!!volume) {
                    const hasDiscoveredVolume = volume.chunks.some(
                        (chunkInVolumePosition) =>
                            hasDiscoveredChunkByChunkPosition(
                                worldDiscovery,
                                player,
                                chunkInVolumePosition,
                            ),
                    );

                    if (!hasDiscoveredVolume) {
                        newVolumes.push(volume);
                    }
                }
            }
        }
    }

    if (chunksToGenerate.length > 0) {
        //TODO: Generate chunk
        //Add discovered tiles to list
        //if a new volume is created add to list
    }

    const effect: DiscoverTileEffect = {
        id: "discoverTile",
        tiles: newPoints.map((point) => {
            return { ...point.point, volume: point.volumeId };
        }),
        volumes: newVolumes,
    };

    root.updateComponent(WorldDiscoveryComponentId, (component) => {
        for (const point of discoveredPoints) {
            discoverTile(component, player, point);
        }
    });

    effectEmitter.emitter(effect);
}

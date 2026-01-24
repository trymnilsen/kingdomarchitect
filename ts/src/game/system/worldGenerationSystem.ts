import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import {
    generateDiamondPattern,
    offsetPatternWithPoint,
} from "../../common/pattern.ts";
import { pointEquals, type Point } from "../../common/point.ts";
import type { DiscoverTileEffect } from "../../server/message/effect/discoverTileEffect.ts";
import type { GameEffect } from "../../server/message/effect/gameEffect.ts";
import { EffectEmitterComponentId } from "../component/effectEmitterComponent.ts";
import {
    createTileComponent,
    getChunk,
    hasChunk,
    setChunk,
    TileComponentId,
    type TileComponent,
} from "../component/tileComponent.ts";
import {
    createWorldDiscoveryComponent,
    discoverTile,
    hasDiscoveredChunkByChunkPosition,
    hasDiscoveredTile,
    WorldDiscoveryComponentId,
    type WorldDiscoveryComponent,
} from "../component/worldDiscoveryComponent.ts";
import { Entity } from "../entity/entity.ts";
import { getChunkPosition } from "../map/chunk.ts";
import { generateChunk } from "../map/chunkGenerator.ts";
import { addInitialPlayerChunk } from "../map/player.ts";
import type { Volume } from "../map/volume.ts";

export const worldGenerationSystem: EcsSystem = {
    onInit,
};

/**
 * Initializes the world generation system.
 * Only generates initial world if no chunks exist (new game).
 */ 
function onInit(root: Entity) {
    // Check if world already exist, this might be the case if we loaded
    const tileComponent = root.requireEcsComponent(TileComponentId);
    const hasWorld = tileComponent.chunks.size > 0;
    if (!hasWorld) {
        const tileComponent = createTileComponent();
        root.setEcsComponent(createWorldDiscoveryComponent());
        root.setEcsComponent(tileComponent);

        console.log("[WorldGeneration] Generating new world");
        const start = addInitialPlayerChunk(root);
        const effectEmitter = root.requireEcsComponent(
            EffectEmitterComponentId,
        ).emitter;
        const pattern = offsetPatternWithPoint(
            start,
            generateDiamondPattern(16),
        );
        setDiscoveryForPlayer(root, effectEmitter, "player", pattern);
    } else {
        console.log(
            "[WorldGeneration] World already exists, skipping generation",
        );
    }
}

type ChunkToGenerate = {
    chunkPosition: Point;
    discoveredPoints: Point[];
};

/**
 * Sets the discovery status for a player based on a list of discovered points.
 * @param root The root entity of the ECS system.
 * @param effectEmitter Function to emit game effects
 * @param player The ID of the player.
 * @param discoveredPoints An array of points that have been discovered.
 */
export function setDiscoveryForPlayer(
    root: Entity,
    effectEmitter: (effect: GameEffect) => void,
    player: string,
    discoveredPoints: Point[],
) {
    const tileComponent = root.requireEcsComponent(TileComponentId);
    const worldDiscovery = root.requireEcsComponent(WorldDiscoveryComponentId);

    const chunksToGenerate: ChunkToGenerate[] = [];
    const newPoints: { point: Point; volumeId: string }[] = [];
    const newVolumesToDiscover: Volume[] = [];

    for (const point of discoveredPoints) {
        const chunkPosition = getChunkPosition(point.x, point.y);
        processDiscoveredPoint(
            point,
            chunkPosition,
            tileComponent,
            worldDiscovery,
            player,
            chunksToGenerate,
            newPoints,
            newVolumesToDiscover,
        );
    }

    for (const chunkToGenerate of chunksToGenerate) {
        const generatedChunk = generateChunk(
            root,
            chunkToGenerate.chunkPosition,
        );
        root.updateComponent(TileComponentId, (component) => {
            setChunk(component, generatedChunk);
        });
        //Check if the volume of the new chunk has been discovered by the
        //player already, it can either be completely new one or an expanded
        //volume from a chunk that the player has not discovered yet
        checkAndAddNewVolume(
            generatedChunk.volume,
            worldDiscovery,
            player,
            newVolumesToDiscover,
        );
        //Add the points that was discovered within this new chunk
        for (const point of chunkToGenerate.discoveredPoints) {
            if (!newPoints.find((item) => pointEquals(item.point, point))) {
                newPoints.push({
                    point: point,
                    volumeId: generatedChunk.volume.id,
                });
            }
        }
    }

    const effect: DiscoverTileEffect = {
        id: "discoverTile",
        tiles: newPoints.map((point) => {
            return { ...point.point, volume: point.volumeId };
        }),
        volumes: newVolumesToDiscover,
    };

    root.updateComponent(WorldDiscoveryComponentId, (component) => {
        for (const point of discoveredPoints) {
            discoverTile(component, player, point);
        }
    });

    effectEmitter(effect);
}

/**
 * Processes a single discovered point, determining if a chunk needs generation,
 * if a tile needs to be marked as discovered, or if a new volume needs to be discovered.
 * @param point The discovered point.
 * @param chunkPosition The chunk coordinates of the point.
 * @param tileComponent The TileComponent instance.
 * @param worldDiscovery The WorldDiscoveryComponent instance.
 * @param player The ID of the player.
 * @param chunksToGenerate Array to push chunk positions that need generation.
 * @param newPoints Array to push newly discovered tiles with their volume IDs.
 * @param newVolumesToDiscover Array to push newly discovered volumes.
 */
function processDiscoveredPoint(
    point: Point,
    chunkPosition: Point,
    tileComponent: TileComponent,
    worldDiscovery: WorldDiscoveryComponent,
    player: string,
    chunksToGenerate: ChunkToGenerate[],
    newPoints: { point: Point; volumeId: string }[],
    newVolumesToDiscover: Volume[],
) {
    //If there is no chunk at this position we should add it to the list of
    //chunks to generate
    if (!hasChunk(tileComponent, chunkPosition)) {
        let existingChunkToGenerate = chunksToGenerate.find((item) =>
            pointEquals(item.chunkPosition, chunkPosition),
        );
        if (!existingChunkToGenerate) {
            existingChunkToGenerate = {
                chunkPosition: chunkPosition,
                discoveredPoints: [],
            };
            chunksToGenerate.push(existingChunkToGenerate);
        }

        existingChunkToGenerate.discoveredPoints.push(point);
        return;
    }

    if (!hasDiscoveredTile(worldDiscovery, player, point)) {
        //If the chunk exists, check if its discovered already, passing a point
        //that is already discovered should be a no-op
        const chunk = getChunk(tileComponent, chunkPosition);
        if (chunk?.volume) {
            newPoints.push({
                point,
                volumeId: chunk.volume.id,
            });
            checkAndAddNewVolume(
                chunk.volume,
                worldDiscovery,
                player,
                newVolumesToDiscover,
            );
        }
    }
}

function checkAndAddNewVolume(
    volume: Volume,
    worldDiscovery: WorldDiscoveryComponent,
    player: string,
    newVolumesToDiscover: Volume[],
) {
    const hasDiscoveredVolume = volume.chunks.some((chunkInVolumePosition) =>
        hasDiscoveredChunkByChunkPosition(
            worldDiscovery,
            player,
            chunkInVolumePosition,
        ),
    );
    if (
        !hasDiscoveredVolume &&
        !newVolumesToDiscover.some((v) => v.id === volume.id)
    ) {
        newVolumesToDiscover.push(volume);
    }
}

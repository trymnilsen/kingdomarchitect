import { getRandomDirection } from "../../common/direction.ts";
import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { log } from "../../common/logging/logger.ts";
import {
    generateDiamondPattern,
    offsetPatternWithPoint,
} from "../../common/pattern.ts";
import {
    adjacentPoint,
    adjacentPoints,
    multiplyPoint,
    pointEquals,
    type Point,
} from "../../common/point.ts";
import {
    DiscoverTileGameMessageType,
    type GameMessage,
} from "../../server/message/gameMessage.ts";
import { MessageEmitterComponentId } from "../component/messageEmitterComponent.ts";
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
import {
    generateChunk,
    type GeneratedChunk,
} from "../map/chunkGenerator.ts";
import {
    placeSettlement,
    placeSettlementIfNoneExists,
} from "../map/item/settlement.ts";
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

        log.info("Generating new world");
        const start = addInitialPlayerChunk(root);
        generateInitialChunks(root);
        const messageEmitter = root.requireEcsComponent(
            MessageEmitterComponentId,
        ).emitter;
        const pattern = offsetPatternWithPoint(
            start,
            generateDiamondPattern(16),
        );
        setDiscoveryForPlayer(root, messageEmitter, "player", pattern);
    } else {
        log.info("World already exists, skipping generation");
    }
}

type ChunkToGenerate = {
    chunkPosition: Point;
    discoveredPoints: Point[];
};

/**
 * Generates the initial chunks of a new world: the 3x3 block of chunks around
 * the player start chunk plus a goblin camp chunk two chunks away in a random
 * cardinal direction, ten chunks in total. The chunk between the player and
 * the camp acts as a path: it is cardinally adjacent to both, so the camp
 * never sits diagonally off a corner of the start chunk.
 *
 * Generation order matters in two places: the path chunk goes first so it
 * deterministically becomes the start biome's second (and final, maxSize 2)
 * chunk, and the camp chunk goes last so its only generated neighbor holds
 * the by-then-full start volume and it always receives a volume of its own.
 * The remaining ring chunks carry no ordering guarantees — a corner chunk
 * generated before any cardinal neighbor simply receives a volume of its
 * own through the empty-adjacency branch in generateChunk.
 */
function generateInitialChunks(root: Entity) {
    const origin = { x: 0, y: 0 };
    const direction = getRandomDirection();
    const pathChunkPosition = adjacentPoint(origin, direction);
    const campChunkPosition = multiplyPoint(pathChunkPosition, 2);
    const ringChunks = [
        pathChunkPosition,
        ...adjacentPoints(origin, true).filter(
            (point) => !pointEquals(point, pathChunkPosition),
        ),
    ];

    let campChunk: GeneratedChunk | undefined;
    root.updateComponent(TileComponentId, (component) => {
        for (const position of ringChunks) {
            const generated = generateChunk(root, position);
            setChunk(component, generated.chunk);
        }
        campChunk = generateChunk(root, campChunkPosition);
        setChunk(component, campChunk.chunk);
    });

    if (!campChunk || campChunk.chunk.volume.isStartBiome) {
        // Skipping placement is self-healing: placeSettlementIfNoneExists
        // hosts the camp in the next discovered chunk instead.
        log.error("Camp chunk missing or in start biome, skipping camp", {
            campChunkPosition,
        });
        return;
    }
    placeSettlement(campChunk.chunk, campChunk.chunkEntity);
}

/**
 * Sets the discovery status for a player based on a list of discovered points.
 * @param root The root entity of the ECS system.
 * @param effectEmitter Function to emit game effects
 * @param player The ID of the player.
 * @param discoveredPoints An array of points that have been discovered.
 */
export function setDiscoveryForPlayer(
    root: Entity,
    messageEmitter: (message: GameMessage) => void,
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
        const generated = generateChunk(root, chunkToGenerate.chunkPosition);
        root.updateComponent(TileComponentId, (component) => {
            setChunk(component, generated.chunk);
        });
        placeSettlementIfNoneExists(
            root,
            generated.chunk,
            generated.chunkEntity,
        );
        //Check if the volume of the new chunk has been discovered by the
        //player already, it can either be completely new one or an expanded
        //volume from a chunk that the player has not discovered yet
        checkAndAddNewVolume(
            generated.chunk.volume,
            worldDiscovery,
            player,
            newVolumesToDiscover,
        );
        //Add the points that was discovered within this new chunk
        for (const point of chunkToGenerate.discoveredPoints) {
            if (!newPoints.find((item) => pointEquals(item.point, point))) {
                newPoints.push({
                    point: point,
                    volumeId: generated.chunk.volume.id,
                });
            }
        }
    }

    root.updateComponent(WorldDiscoveryComponentId, (component) => {
        for (const point of discoveredPoints) {
            discoverTile(component, player, point);
        }
    });

    messageEmitter({
        type: DiscoverTileGameMessageType,
        tiles: newPoints.map((point) => {
            return { ...point.point, volume: point.volumeId };
        }),
        volumes: newVolumesToDiscover,
    });
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

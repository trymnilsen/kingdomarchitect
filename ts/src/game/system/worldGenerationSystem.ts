import { getRandomDirection } from "../../common/direction.ts";
import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import { log } from "../../common/logging/logger.ts";
import {
    generateDiamondPattern,
    offsetPatternWithPoint,
} from "../../common/pattern.ts";
import {
    adjacentPoint,
    adjacentPoints,
    encodePosition,
    multiplyPoint,
    pointEquals,
    type Point,
} from "../../common/point.ts";
import {
    createTileComponent,
    hasChunk,
    setChunk,
    TileComponentId,
} from "../component/tileComponent.ts";
import {
    createWorldDiscoveryComponent,
    discoverTile,
    hasDiscoveredTile,
    WorldDiscoveryComponentId,
} from "../component/worldDiscoveryComponent.ts";
import { Entity } from "../entity/entity.ts";
import { createGroundDiscoveredGameEvent } from "../entity/event/groundDiscoveredGameEventData.ts";
import { getChunkPosition } from "../map/chunk.ts";
import { generateChunk, type GeneratedChunk } from "../map/chunkGenerator.ts";
import {
    placeSettlement,
    placeSettlementIfNoneExists,
} from "../map/item/settlement.ts";
import { addInitialPlayerChunk } from "../map/player.ts";

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
        const pattern = offsetPatternWithPoint(
            start,
            generateDiamondPattern(16),
        );
        setDiscoveryForPlayer(root, "player", pattern);
    } else {
        log.info("World already exists, skipping generation");
    }
}

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
 * The remaining ring chunks carry no ordering guarantees. A corner chunk
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

export function setDiscoveryForPlayer(
    root: Entity,
    player: string,
    discoveredPoints: Point[],
) {
    const tileComponent = root.requireEcsComponent(TileComponentId);
    const worldDiscovery = root.requireEcsComponent(WorldDiscoveryComponentId);

    const newTiles = new Map<number, Point>();
    const chunksToGenerate = new Map<number, Point>();
    for (const point of discoveredPoints) {
        if (hasDiscoveredTile(worldDiscovery, player, point)) {
            continue;
        }
        newTiles.set(encodePosition(point.x, point.y), point);

        const chunkPosition = getChunkPosition(point.x, point.y);
        if (!hasChunk(tileComponent, chunkPosition)) {
            chunksToGenerate.set(
                encodePosition(chunkPosition.x, chunkPosition.y),
                chunkPosition,
            );
        }
    }

    for (const chunkPosition of chunksToGenerate.values()) {
        const generated = generateChunk(root, chunkPosition);
        root.updateComponent(TileComponentId, (component) => {
            setChunk(component, generated.chunk);
        });
        placeSettlementIfNoneExists(
            root,
            generated.chunk,
            generated.chunkEntity,
        );
    }

    root.updateComponent(WorldDiscoveryComponentId, (component) => {
        for (const point of discoveredPoints) {
            discoverTile(component, player, point);
        }
    });

    if (newTiles.size === 0 && chunksToGenerate.size === 0) {
        return;
    }
    root.bubbleEvent(
        createGroundDiscoveredGameEvent(root, {
            player,
            discoveredTiles: [...newTiles.values()],
            generatedChunks: [...chunksToGenerate.values()],
        }),
    );
}

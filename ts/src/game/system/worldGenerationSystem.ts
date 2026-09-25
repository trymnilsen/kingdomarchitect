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
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { EquipmentComponentId } from "../component/equipmentComponent.ts";
import { LightSourceComponentId } from "../component/lightSourceComponent.ts";
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
import { generateChunk, type GeneratedChunk } from "../map/chunkGenerator.ts";
import { getVisibilityOffsets } from "../map/discoverFootprint.ts";
import {
    placeSettlement,
    placeSettlementIfNoneExists,
} from "../map/item/settlement.ts";
import { addInitialPlayerChunk } from "../map/player.ts";
import type { Volume } from "../map/volume.ts";
import { canReveal } from "../vision/visionReach.ts";

/**
 * The discovery data is kept per player id. TODO: update this to take the id
 * for the ancestor kingdom component when we go multiplayer
 */
const PlayerId = "player";

/**
 * What a reveal found that the player had not seen before.
 */
export type GroundDiscovery = {
    discoveredTiles: Point[];
    generatedChunks: Point[];
};

export function makeWorldGenSystem(
    onGroundDiscovered: (discovery: GroundDiscovery) => void,
): EcsSystem {
    let initialised = false;

    function reveal(root: Entity, points: Point[]) {
        const discovery = revealPoints(root, PlayerId, points);
        if (discovery) {
            onGroundDiscovered(discovery);
        }
    }

    /**
     * The one path from "something changed what this entity sees" to the map.
     * Revealing is idempotent, so a trigger that fires more often than the
     * footprint changes only costs a lookup per tile.
     *
     * Generating a chunk inside a reveal adds trees, animals and possibly a
     * camp, which fire their own events into this same handler. The sees right
     * now rule filters them out, so they do not start another reveal.
     */
    function revealWhatEntitySees(root: Entity, entity: Entity) {
        if (!initialised || !canReveal(entity)) {
            return;
        }
        reveal(
            root,
            offsetPatternWithPoint(
                entity.worldPosition,
                getVisibilityOffsets(entity),
            ),
        );
    }

    return {
        onInit: (root) => {
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
                reveal(
                    root,
                    offsetPatternWithPoint(start, generateDiamondPattern(16)),
                );
            } else {
                log.info("World already exists, skipping generation");
            }
            initialised = true;
        },
        onEntityEvent: {
            transform: (root, event) => {
                revealWhatEntitySees(root, event.source);
            },
        },
        onComponent: {
            updated: {
                [LightSourceComponentId]: (root, event) => {
                    revealWhatEntitySees(root, event.source);
                },
                [BuildingComponentId]: (root, event) => {
                    revealWhatEntitySees(root, event.source);
                },
                [EquipmentComponentId]: (root, event) => {
                    revealWhatEntitySees(root, event.source);
                },
            },
        },
    };
}

/**
 * Generates the 3x3 chunks around the player start plus a goblin camp two
 * chunks away in a random cardinal direction. The path chunk between them goes
 * first so it fills up the start biome, and the camp goes last so it always
 * gets a volume of its own
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
 * Marks the points discovered for the player, generating the chunks if needed
 * @returns discovered points and chunks. Null when every point has already been discovered
 */
function revealPoints(
    root: Entity,
    player: string,
    points: Point[],
): GroundDiscovery | null {
    const tileComponent = root.requireEcsComponent(TileComponentId);
    const worldDiscovery = root.requireEcsComponent(WorldDiscoveryComponentId);

    const newTiles = new Map<number, Point>();
    const chunksOfNewTiles = new Map<number, Point>();
    const chunksToGenerate = new Map<number, Point>();
    for (const point of points) {
        if (hasDiscoveredTile(worldDiscovery, player, point)) {
            continue;
        }
        newTiles.set(encodePosition(point.x, point.y), point);

        const chunkPosition = getChunkPosition(point.x, point.y);
        const chunkKey = encodePosition(chunkPosition.x, chunkPosition.y);
        chunksOfNewTiles.set(chunkKey, chunkPosition);
        if (!hasChunk(tileComponent, chunkPosition)) {
            chunksToGenerate.set(chunkKey, chunkPosition);
        }
    }

    if (newTiles.size === 0) {
        return null;
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
        for (const point of newTiles.values()) {
            discoverTile(component, player, point);
        }
    });

    return {
        discoveredTiles: [...newTiles.values()],
        generatedChunks: [...chunksToGenerate.values()],
    };
}

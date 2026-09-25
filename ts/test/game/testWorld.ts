import { Entity } from "../../src/game/entity/entity.ts";
import {
    createTileComponent,
    setChunk,
    TileComponentId,
    type TileComponent,
} from "../../src/game/component/tileComponent.ts";
import { createChunkMapComponent } from "../../src/game/component/chunkMapComponent.ts";
import { EcsWorld } from "../../src/ecs/ecsWorld.ts";
import { chunkMapSystem } from "../../src/game/system/chunkMapSystem.ts";
import { createPathfindingGraphComponent } from "../../src/game/component/pathfindingGraphComponent.ts";
import { createLazyGraphFromRootNode } from "../../src/game/map/path/graph/generateGraph.ts";
import { ChunkSize, createLandTerrain } from "../../src/game/map/chunk.ts";
import type { Point } from "../../src/common/point.ts";
import type { Bounds } from "../../src/common/bounds.ts";
import type { BiomeType } from "../../src/game/map/biome.ts";
import type { Volume } from "../../src/game/map/volume.ts";
import type { Building } from "../../src/data/building/building.ts";
import { stockPile } from "../../src/data/building/wood/storage.ts";
import { buildingPrefab } from "../../src/game/prefab/buildingPrefab.ts";
import { nullBuilding } from "../../src/data/building/building.ts";
import { createBuildingComponent } from "../../src/game/component/buildingComponent.ts";
import { createSpriteComponent } from "../../src/game/component/spriteComponent.ts";
import { emptySpriteRef } from "../../src/asset/sprite.ts";
import { resourcePrefab } from "../../src/game/prefab/resourcePrefab.ts";
import type { NaturalResource } from "../../src/data/inventory/items/naturalResource.ts";

/**
 * Build the smallest viable world for tests: a chunk-mapped tile grid
 * sized to cover the requested origin neighbourhood. Use this whenever
 * a test needs to query entities by position, run drop searches, or
 * spawn ground-pile entities, or anything else that walks the chunk map.
 *
 * Tests that don't touch position queries can keep using a bare
 * `new Entity("root")`. This helper is the upgrade for the cases that do.
 */
export function createMinimalWorld(
    chunkRange: { minChunk: number; maxChunk: number } = {
        minChunk: -1,
        maxChunk: 1,
    },
    biome?: BiomeType,
): { root: Entity; world: EcsWorld } {
    const world = new EcsWorld();
    world.addSystem(chunkMapSystem);
    const root = world.root;

    const volume = biome ? testVolume(biome) : undefined;
    const tileComponent = createTileComponent();
    for (let cx = chunkRange.minChunk; cx <= chunkRange.maxChunk; cx++) {
        for (let cy = chunkRange.minChunk; cy <= chunkRange.maxChunk; cy++) {
            setChunk(tileComponent, {
                chunkX: cx,
                chunkY: cy,
                volume,
                terrain: createLandTerrain(),
            });
        }
    }
    root.setEcsComponent(tileComponent);
    root.setEcsComponent(createChunkMapComponent());

    return { root, world };
}

/**
 * A volume of one biome for tests to hang on chunks. `chunks` is left empty
 * because nothing reads volume membership back; the tile lookups all go through
 * the chunk's own volume reference.
 */
export function testVolume(biome: BiomeType): Volume {
    return {
        id: `${biome}-test-volume`,
        maxSize: 64,
        chunks: [],
        type: biome,
        debugColor: "#ffffff",
    };
}

/**
 * Put one chunk in a different biome from the rest of a test world. Biome is a
 * property of the chunk, so neighbouring tiles can belong to different biomes,
 * and anything that decides per tile needs a world shaped like that to be
 * tested at all.
 */
export function setChunkBiome(
    root: Entity,
    chunkPosition: Point,
    biome: BiomeType,
): void {
    const tiles = root.requireEcsComponent(TileComponentId);
    setChunk(tiles, {
        chunkX: chunkPosition.x,
        chunkY: chunkPosition.y,
        volume: testVolume(biome),
        terrain: createLandTerrain(),
    });
}

/**
 * A world whose chunks cover the given tile bounds with a chunk of margin on
 * every side, carrying a pathfinding graph as well as the chunk map. Use this
 * for tests that move workers or query paths. `createMinimalWorld` is enough
 * when a test only looks entities up by position.
 */
export function createWorldCovering(
    bounds: { min: Point; max: Point },
    biome?: BiomeType,
): {
    root: Entity;
    world: EcsWorld;
} {
    const minChunk =
        Math.floor(Math.min(bounds.min.x, bounds.min.y) / ChunkSize) - 1;
    const maxChunk =
        Math.floor(Math.max(bounds.max.x, bounds.max.y) / ChunkSize) + 1;

    const { root, world } = createMinimalWorld({ minChunk, maxChunk }, biome);
    root.setEcsComponent(
        createPathfindingGraphComponent(createLazyGraphFromRootNode(root)),
    );

    return { root, world };
}

/**
 * Put a real building on the map, through the prefab the game uses. Position
 * goes on after parenting, and the prefab's sprite is what gets it into the
 * chunk map
 */
export function addBuilding(
    root: Entity,
    id: string,
    position: Point,
    building: Building = stockPile,
): Entity {
    const entity = buildingPrefab(building, false, id);
    root.addChild(entity);
    entity.worldPosition = position;
    return entity;
}

/** Put a real natural resource on the map, for the same reasons */
export function addResource(
    root: Entity,
    resource: NaturalResource,
    position: Point,
): Entity {
    const entity = resourcePrefab(resource);
    root.addChild(entity);
    entity.worldPosition = position;
    return entity;
}

export function addGroundCovering(
    tiles: TileComponent,
    bounds: Bounds,
    volume?: Volume,
): void {
    // ground snaps to whole chunks so it can reach past the bounds
    const x1 = Math.floor(bounds.x1 / ChunkSize);
    const y1 = Math.floor(bounds.y1 / ChunkSize);
    const x2 = Math.floor(bounds.x2 / ChunkSize);
    const y2 = Math.floor(bounds.y2 / ChunkSize);
    for (let cx = x1; cx <= x2; cx++) {
        for (let cy = y1; cy <= y2; cy++) {
            setChunk(tiles, {
                chunkX: cx,
                chunkY: cy,
                volume,
                terrain: createLandTerrain(),
            });
        }
    }
}

export function wallOff(root: Entity, bounds: Bounds): void {
    const addWall = (x: number, y: number) => {
        const wall = new Entity(`wall-${x}-${y}`);
        wall.setEcsComponent(createSpriteComponent(emptySpriteRef));
        wall.setEcsComponent(createBuildingComponent(nullBuilding, false));
        root.addChild(wall);
        wall.worldPosition = { x, y };
    };
    for (let x = bounds.x1 - 1; x <= bounds.x2 + 1; x++) {
        addWall(x, bounds.y1 - 1);
        addWall(x, bounds.y2 + 1);
    }
    for (let y = bounds.y1; y <= bounds.y2; y++) {
        addWall(bounds.x1 - 1, y);
        addWall(bounds.x2 + 1, y);
    }
}

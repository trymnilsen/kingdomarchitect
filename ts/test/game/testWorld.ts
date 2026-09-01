import { Entity } from "../../src/game/entity/entity.ts";
import {
    createTileComponent,
    setChunk,
} from "../../src/game/component/tileComponent.ts";
import { createChunkMapComponent } from "../../src/game/component/chunkMapComponent.ts";
import { EcsWorld } from "../../src/ecs/ecsWorld.ts";
import { chunkMapSystem } from "../../src/game/system/chunkMapSystem.ts";
import { createPathfindingGraphComponent } from "../../src/game/component/pathfindingGraphComponent.ts";
import { createLazyGraphFromRootNode } from "../../src/game/map/path/graph/generateGraph.ts";
import { ChunkSize } from "../../src/game/map/chunk.ts";
import type { Point } from "../../src/common/point.ts";

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
): { root: Entity; world: EcsWorld } {
    const world = new EcsWorld();
    world.addSystem(chunkMapSystem);
    const root = world.root;

    const tileComponent = createTileComponent();
    for (let cx = chunkRange.minChunk; cx <= chunkRange.maxChunk; cx++) {
        for (let cy = chunkRange.minChunk; cy <= chunkRange.maxChunk; cy++) {
            setChunk(tileComponent, { chunkX: cx, chunkY: cy });
        }
    }
    root.setEcsComponent(tileComponent);
    root.setEcsComponent(createChunkMapComponent());

    return { root, world };
}

/**
 * A world whose chunks cover the given tile bounds with a chunk of margin on
 * every side, carrying a pathfinding graph as well as the chunk map. Use this
 * for tests that move workers or query paths. `createMinimalWorld` is enough
 * when a test only looks entities up by position.
 */
export function createWorldCovering(bounds: { min: Point; max: Point }): {
    root: Entity;
    world: EcsWorld;
} {
    const minChunk =
        Math.floor(Math.min(bounds.min.x, bounds.min.y) / ChunkSize) - 1;
    const maxChunk =
        Math.floor(Math.max(bounds.max.x, bounds.max.y) / ChunkSize) + 1;

    const { root, world } = createMinimalWorld({ minChunk, maxChunk });
    root.setEcsComponent(
        createPathfindingGraphComponent(createLazyGraphFromRootNode(root)),
    );

    return { root, world };
}

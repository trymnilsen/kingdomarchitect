import { Entity } from "../../src/game/entity/entity.ts";
import {
    createTileComponent,
    setChunk,
} from "../../src/game/component/tileComponent.ts";
import { createChunkMapComponent } from "../../src/game/component/chunkMapComponent.ts";
import { EcsWorld } from "../../src/common/ecs/ecsWorld.ts";
import { chunkMapSystem } from "../../src/game/system/chunkMapSystem.ts";

/**
 * Build the smallest viable world for tests: a chunk-mapped tile grid
 * sized to cover the requested origin neighbourhood. Use this whenever
 * a test needs to query entities by position, run drop searches, or
 * spawn ground-pile entities — anything that walks the chunk map.
 *
 * Tests that don't touch position queries can keep using a bare
 * `new Entity("root")`; this helper is the upgrade for the cases that do.
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

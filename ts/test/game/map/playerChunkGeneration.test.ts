import assert from "node:assert";
import { describe, it } from "node:test";
import {
    addInitialPlayerChunk,
    pickSettlementOffset,
} from "../../../src/game/map/player.ts";
import { getChunk } from "../../../src/game/component/tileComponent.ts";
import { TileComponentId } from "../../../src/game/component/tileComponent.ts";
import { PlayerUnitComponentId } from "../../../src/game/component/playerUnitComponent.ts";
import { KingdomComponentId } from "../../../src/game/component/kingdomComponent.ts";
import { ChunkSize, getTerrainInChunk } from "../../../src/game/map/chunk.ts";
import { Terrain } from "../../../src/game/map/terrain.ts";
import {
    createEmptyMask,
    isMaskSet,
    stampMask,
    type TileMask,
} from "../../../src/game/map/tileMask.ts";
import type { Entity } from "../../../src/game/entity/entity.ts";
import type { Point } from "../../../src/common/point.ts";
import { createMinimalWorld } from "../testWorld.ts";
import {
    assertChunkMapMatchesTree,
    assertTransformsConsistent,
} from "../worldInvariants.ts";
import { seededRandom } from "../../seededRandom.ts";

const settlementSize = 3;
const lakeClearance = 2;

function distanceToWater(
    water: (x: number, y: number) => boolean,
    tile: Point,
) {
    let nearest = Infinity;
    for (let y = 0; y < ChunkSize; y++) {
        for (let x = 0; x < ChunkSize; x++) {
            if (water(x, y)) {
                nearest = Math.min(
                    nearest,
                    Math.max(Math.abs(x - tile.x), Math.abs(y - tile.y)),
                );
            }
        }
    }
    return nearest;
}

function footprintTiles(corner: Point): Point[] {
    const tiles: Point[] = [];
    for (let dy = 0; dy < settlementSize; dy++) {
        for (let dx = 0; dx < settlementSize; dx++) {
            tiles.push({ x: corner.x + dx, y: corner.y + dy });
        }
    }
    return tiles;
}

function descendants(entity: Entity): Entity[] {
    return entity.children.flatMap((child) => [child, ...descendants(child)]);
}

/**
 * addInitialPlayerChunk builds the starting chunk with the player kingdom,
 * first worker, buildings, and scattered resources. The layout is partly
 * random, so these tests pin the structural invariants of the result
 * rather than exact positions.
 */
describe("addInitialPlayerChunk", () => {
    it("registers the start chunk as the start biome", () => {
        const { root } = createMinimalWorld();

        addInitialPlayerChunk(root);

        const tiles = root.requireEcsComponent(TileComponentId);
        const startChunk = getChunk(tiles, { x: 0, y: 0 });
        assert.ok(startChunk, "chunk (0,0) should be registered");
        assert.strictEqual(startChunk.volume?.isStartBiome, true);
    });

    it("keeps transforms consistent across the generated entity tree", () => {
        const { root } = createMinimalWorld();

        addInitialPlayerChunk(root);

        assertTransformsConsistent(root);
    });

    it("indexes the generated entities in the chunk map", () => {
        const { root } = createMinimalWorld();

        addInitialPlayerChunk(root);

        assertChunkMapMatchesTree(root);
    });

    it("places the first worker at the returned spawn position, under the kingdom", () => {
        const { root } = createMinimalWorld();

        const workerPosition = addInitialPlayerChunk(root);

        const units = root.queryComponents(PlayerUnitComponentId);
        assert.strictEqual(units.size, 1, "should spawn exactly one worker");
        const worker = [...units.keys()][0];
        assert.deepStrictEqual(worker.worldPosition, workerPosition);
        assert.ok(
            worker.parent?.hasComponent(KingdomComponentId),
            "the worker should be parented to the player kingdom",
        );
    });

    it("starts beside a small lake, keeping the settlement off its shore", () => {
        for (let seed = 1; seed <= 40; seed++) {
            const { root } = createMinimalWorld();

            addInitialPlayerChunk(root, seededRandom(seed));

            const chunk = getChunk(root.requireEcsComponent(TileComponentId), {
                x: 0,
                y: 0,
            });
            assert.ok(chunk);
            const isWater = (x: number, y: number) =>
                getTerrainInChunk(chunk, x, y) === Terrain.Water;

            let minX = ChunkSize;
            let minY = ChunkSize;
            let maxX = -1;
            let maxY = -1;
            for (let y = 0; y < ChunkSize; y++) {
                for (let x = 0; x < ChunkSize; x++) {
                    if (isWater(x, y)) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
            assert.ok(maxX >= 0, `seed ${seed}: the start chunk has a lake`);
            assert.ok(
                maxX - minX < 6 && maxY - minY < 6,
                `seed ${seed}: the lake is at most 6x6`,
            );

            const kingdom = [
                ...root.queryComponents(KingdomComponentId).keys(),
            ][0];
            for (const member of descendants(kingdom)) {
                assert.ok(
                    distanceToWater(isWater, member.worldPosition) >
                        lakeClearance,
                    `seed ${seed}: ${member.id} is too close to the lake`,
                );
            }
            for (const entity of descendants(root)) {
                const { x, y } = entity.worldPosition;
                const insideChunk =
                    x >= 0 && y >= 0 && x < ChunkSize && y < ChunkSize;
                assert.ok(
                    !insideChunk || !isWater(x, y),
                    `seed ${seed}: ${entity.id} stands in the lake`,
                );
            }
        }
    });
});

describe("pickSettlementOffset", () => {
    const preferredMin = ChunkSize / 2 - 3;
    const preferredMax = preferredMin + 3;

    it("keeps the settlement centered when the lake is out of the way", () => {
        const lake = stampMask(
            createEmptyMask(ChunkSize, ChunkSize),
            { width: 2, height: 2, rows: [0b11, 0b11] },
            ChunkSize - 2,
            ChunkSize - 2,
        );

        for (let seed = 1; seed <= 40; seed++) {
            const corner = pickSettlementOffset(lake, seededRandom(seed));
            for (const axis of [corner.x, corner.y]) {
                assert.ok(
                    axis >= preferredMin && axis <= preferredMax,
                    `seed ${seed}: ${corner.x},${corner.y} is off center`,
                );
            }
        }
    });

    it("moves the settlement clear of a lake in its way", () => {
        const lake: TileMask = stampMask(
            createEmptyMask(ChunkSize, ChunkSize),
            {
                width: 6,
                height: 6,
                rows: new Array<number>(6).fill(0b111111),
            },
            preferredMin,
            preferredMin,
        );

        for (let seed = 1; seed <= 40; seed++) {
            const corner = pickSettlementOffset(lake, seededRandom(seed));
            for (const tile of footprintTiles(corner)) {
                assert.ok(
                    distanceToWater((x, y) => isMaskSet(lake, x, y), tile) >
                        lakeClearance,
                    `seed ${seed}: tile ${tile.x},${tile.y} is too close to the lake`,
                );
            }
        }
    });
});

import assert from "node:assert";
import { describe, it } from "node:test";
import {
    findRandomSpawnInDiamond,
    getDiamondPoints,
} from "../../../../src/game/map/item/placement.ts";
import { createChunkMap } from "../../../../src/game/component/chunkMapComponent.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { encodePosition } from "../../../../src/common/point.ts";
import { SparseSet } from "../../../../src/common/structure/sparseSet.ts";

describe("placement", () => {
    describe("getDiamondPoints", () => {
        it("returns correct points for radius 1", () => {
            const points = getDiamondPoints({ x: 5, y: 5 }, 1);

            // Radius 1 diamond should have 5 points (center + 4 adjacent)
            assert.strictEqual(points.length, 5);

            // Check center
            const hasCenter = points.some((p) => p.x === 5 && p.y === 5);
            assert.strictEqual(hasCenter, true, "Should include center");

            // Check cardinal directions
            const hasUp = points.some((p) => p.x === 5 && p.y === 4);
            const hasDown = points.some((p) => p.x === 5 && p.y === 6);
            const hasLeft = points.some((p) => p.x === 4 && p.y === 5);
            const hasRight = points.some((p) => p.x === 6 && p.y === 5);

            assert.strictEqual(hasUp, true);
            assert.strictEqual(hasDown, true);
            assert.strictEqual(hasLeft, true);
            assert.strictEqual(hasRight, true);
        });

        it("returns correct points for radius 2", () => {
            const points = getDiamondPoints({ x: 0, y: 0 }, 2);

            // Radius 2 diamond: count of points where |dx| + |dy| <= 2
            // dx=-2: dy=0 (1 point)
            // dx=-1: dy=-1,0,1 (3 points)
            // dx=0: dy=-2,-1,0,1,2 (5 points)
            // dx=1: dy=-1,0,1 (3 points)
            // dx=2: dy=0 (1 point)
            // Total: 1+3+5+3+1 = 13 points
            assert.strictEqual(points.length, 13);
        });

        it("diamond pattern follows |dx| + |dy| <= radius rule", () => {
            const center = { x: 10, y: 10 };
            const radius = 3;
            const points = getDiamondPoints(center, radius);

            for (const point of points) {
                const dx = Math.abs(point.x - center.x);
                const dy = Math.abs(point.y - center.y);
                assert.ok(
                    dx + dy <= radius,
                    `Point (${point.x}, ${point.y}) violates diamond rule: |${dx}| + |${dy}| > ${radius}`,
                );
            }
        });
    });

    describe("findRandomSpawnInDiamond", () => {
        it("returns a point within the diamond radius", () => {
            const center = { x: 10, y: 10 };
            const radius = 5;
            const chunkMap = createChunkMap();

            const result = findRandomSpawnInDiamond(center, radius, chunkMap);

            assert.ok(result, "Should return a point");
            const dx = Math.abs(result.x - center.x);
            const dy = Math.abs(result.y - center.y);
            assert.ok(
                dx + dy <= radius,
                `Result (${result.x}, ${result.y}) should be within diamond`,
            );
        });

        it("excludes the center tile", () => {
            const center = { x: 5, y: 5 };
            const radius = 1;
            const chunkMap = createChunkMap();

            // Run multiple times to increase confidence
            for (let i = 0; i < 20; i++) {
                const result = findRandomSpawnInDiamond(
                    center,
                    radius,
                    chunkMap,
                );
                assert.ok(result, "Should return a point");
                const isCenter = result.x === center.x && result.y === center.y;
                assert.strictEqual(
                    isCenter,
                    false,
                    "Should not return center tile",
                );
            }
        });

        it("returns null when all positions are occupied", () => {
            const center = { x: 5, y: 5 };
            const radius = 1;
            const chunkMap = createChunkMap();

            // Create entities at all non-center positions in diamond
            // Radius 1 diamond has 4 non-center positions
            const positions = [
                { x: 5, y: 4 },
                { x: 5, y: 6 },
                { x: 4, y: 5 },
                { x: 6, y: 5 },
            ];

            for (const pos of positions) {
                const entity = new Entity("blocker");
                entity.worldPosition = pos;
                // Add to chunk map
                const chunkKey = encodePosition(
                    Math.floor(pos.x / 16),
                    Math.floor(pos.y / 16),
                );
                if (!chunkMap.chunks.has(chunkKey)) {
                    chunkMap.chunks.set(chunkKey, new SparseSet<Entity>());
                }
                chunkMap.chunks.get(chunkKey)!.add(entity);
            }

            const result = findRandomSpawnInDiamond(center, radius, chunkMap);

            assert.strictEqual(result, null, "Should return null when all occupied");
        });

        it("avoids occupied positions", () => {
            const center = { x: 5, y: 5 };
            const radius = 1;
            const chunkMap = createChunkMap();

            // Occupy 3 of 4 non-center positions
            const occupiedPositions = [
                { x: 5, y: 4 },
                { x: 5, y: 6 },
                { x: 4, y: 5 },
            ];

            for (const pos of occupiedPositions) {
                const entity = new Entity("blocker");
                entity.worldPosition = pos;
                const chunkKey = encodePosition(
                    Math.floor(pos.x / 16),
                    Math.floor(pos.y / 16),
                );
                if (!chunkMap.chunks.has(chunkKey)) {
                    chunkMap.chunks.set(chunkKey, new SparseSet<Entity>());
                }
                chunkMap.chunks.get(chunkKey)!.add(entity);
            }

            // Only valid position is (6, 5)
            const result = findRandomSpawnInDiamond(center, radius, chunkMap);

            assert.ok(result, "Should return the only available position");
            assert.strictEqual(result.x, 6);
            assert.strictEqual(result.y, 5);
        });
    });
});

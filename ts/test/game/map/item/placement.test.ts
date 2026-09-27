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

            assert.strictEqual(
                result,
                null,
                "Should return null when all occupied",
            );
        });
    });
});

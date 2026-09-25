import assert from "node:assert";
import { describe, it } from "node:test";
import type { Point } from "../../../../../../../src/common/point.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../../../../../src/game/component/tileComponent.ts";
import { Entity } from "../../../../../../../src/game/entity/entity.ts";
import {
    landApplicability,
    onLand,
} from "../../../../../../../src/game/interaction/state/building/placement/applicability/landApplicability.ts";
import type { BuildingApplicability } from "../../../../../../../src/game/interaction/state/building/placement/buildingApplicability.ts";
import {
    ChunkSize,
    createLandTerrain,
    terrainIndex,
} from "../../../../../../../src/game/map/chunk.ts";
import { Terrain } from "../../../../../../../src/game/map/terrain.ts";

const chunkX = 2;
const chunkY = 1;
const candidate: Point = {
    x: chunkX * ChunkSize + 4,
    y: chunkY * ChunkSize + 3,
};

function createWorldWithCandidateTerrain(terrain: Terrain): Entity {
    const chunkTerrain = createLandTerrain();
    chunkTerrain[terrainIndex(4, 3)] = terrain;
    const tileComponent = createTileComponent();
    setChunk(tileComponent, { chunkX, chunkY, terrain: chunkTerrain });
    const root = new Entity("root");
    root.setEcsComponent(tileComponent);
    return root;
}

describe("landApplicability", () => {
    it("accepts land", () => {
        const world = createWorldWithCandidateTerrain(Terrain.Land);

        assert.strictEqual(
            landApplicability(candidate, world).isApplicable,
            true,
        );
    });

    it("rejects water and ice and names the terrain", () => {
        const water = landApplicability(
            candidate,
            createWorldWithCandidateTerrain(Terrain.Water),
        );
        const ice = landApplicability(
            candidate,
            createWorldWithCandidateTerrain(Terrain.Ice),
        );

        assert.ok(!water.isApplicable && water.reason === "Water");
        assert.ok(!ice.isApplicable && ice.reason === "Ice");
    });

    it("rejects a tile outside the generated world", () => {
        const world = createWorldWithCandidateTerrain(Terrain.Land);
        const outside: Point = {
            x: candidate.x + ChunkSize * 5,
            y: candidate.y,
        };

        assert.strictEqual(
            landApplicability(outside, world).isApplicable,
            false,
        );
    });
});

describe("onLand", () => {
    it("does not ask the wrapped rule when the tile is not land", () => {
        let asked = false;
        const wrapped: BuildingApplicability = () => {
            asked = true;
            return { isApplicable: true };
        };
        const world = createWorldWithCandidateTerrain(Terrain.Water);

        const result = onLand(wrapped)(candidate, world);

        assert.strictEqual(result.isApplicable, false);
        assert.strictEqual(asked, false);
    });

    it("returns the wrapped rule's answer on land", () => {
        const wrapped: BuildingApplicability = () => ({
            isApplicable: false,
            reason: "Needs to be next to stone",
        });
        const world = createWorldWithCandidateTerrain(Terrain.Land);

        const result = onLand(wrapped)(candidate, world);

        assert.ok(
            !result.isApplicable &&
                result.reason === "Needs to be next to stone",
        );
    });
});

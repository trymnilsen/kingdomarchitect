import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../../../src/game/entity/entity.ts";
import {
    createChunkMapComponent,
    ChunkMapComponentId,
} from "../../../../../../src/game/component/chunkMapComponent.ts";
import { createProductionComponent } from "../../../../../../src/game/component/productionComponent.ts";
import { SparseSet } from "../../../../../../src/common/structure/sparseSet.ts";
import { encodePosition } from "../../../../../../src/common/point.ts";
import { ChunkSize } from "../../../../../../src/game/map/chunk.ts";
import { forresterApplicability } from "../../../../../../src/game/interaction/state/building2/applicability/forresterApplicability.ts";
import { forresterProduction } from "../../../../../../src/data/production/productionDefinition.ts";

/**
 * Register an entity into the chunk map at its current worldPosition
 * so that queryEntity can find it.
 */
function registerInChunkMap(world: Entity, entity: Entity): void {
    const chunkMapComp = world.getEcsComponent(ChunkMapComponentId)!;
    const { x, y } = entity.worldPosition;
    const chunkX = Math.floor(x / ChunkSize);
    const chunkY = Math.floor(y / ChunkSize);
    const chunkKey = encodePosition(chunkX, chunkY);

    if (!chunkMapComp.chunkMap.chunks.has(chunkKey)) {
        chunkMapComp.chunkMap.chunks.set(chunkKey, new SparseSet<Entity>());
    }
    chunkMapComp.chunkMap.chunks.get(chunkKey)!.add(entity);
}

function createWorld(): Entity {
    const world = new Entity("world");
    world.setEcsComponent(createChunkMapComponent());
    return world;
}

describe("forresterApplicability", () => {
    it("returns applicable when no other forrester is nearby", () => {
        const world = createWorld();

        const result = forresterApplicability({ x: 10, y: 10 }, world);

        assert.strictEqual(result.isApplicable, true);
    });

    it("returns not applicable when another forrester is within zone radius", () => {
        const world = createWorld();

        // Place an existing forrester 1 tile away (within zone radius)
        const existingForrester = new Entity("existingForrester");
        existingForrester.worldPosition = {
            x: 10 + forresterProduction.zoneRadius - 1,
            y: 10,
        };
        existingForrester.setEcsComponent(
            createProductionComponent("forrester_production", 4),
        );
        registerInChunkMap(world, existingForrester);

        const result = forresterApplicability({ x: 10, y: 10 }, world);

        assert.strictEqual(result.isApplicable, false);
        if (!result.isApplicable) {
            assert.ok(
                result.reason.length > 0,
                "Should provide a reason string",
            );
        }
    });

    it("returns applicable when existing forrester is beyond zone radius", () => {
        const world = createWorld();

        // Place an existing forrester 2 tiles beyond zone radius
        const existingForrester = new Entity("existingForrester");
        existingForrester.worldPosition = {
            x: 10 + forresterProduction.zoneRadius + 2,
            y: 10,
        };
        existingForrester.setEcsComponent(
            createProductionComponent("forrester_production", 4),
        );
        registerInChunkMap(world, existingForrester);

        const result = forresterApplicability({ x: 10, y: 10 }, world);

        assert.strictEqual(result.isApplicable, true);
    });

    it("returns not applicable when another forrester is exactly at zone radius", () => {
        const world = createWorld();

        // Manhattan distance of exactly zoneRadius from {x:10, y:10}
        const existingForrester = new Entity("existingForrester");
        existingForrester.worldPosition = {
            x: 10 + forresterProduction.zoneRadius,
            y: 10,
        };
        existingForrester.setEcsComponent(
            createProductionComponent("forrester_production", 4),
        );
        registerInChunkMap(world, existingForrester);

        const result = forresterApplicability({ x: 10, y: 10 }, world);

        assert.strictEqual(result.isApplicable, false);
    });

    it("ignores non-forrester production buildings nearby", () => {
        const world = createWorld();

        // A quarry within radius should not block placement
        const quarry = new Entity("quarry");
        quarry.worldPosition = { x: 12, y: 10 };
        quarry.setEcsComponent(createProductionComponent("quarry_production", 4));
        registerInChunkMap(world, quarry);

        const result = forresterApplicability({ x: 10, y: 10 }, world);

        assert.strictEqual(result.isApplicable, true);
    });
});

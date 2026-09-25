import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../../../../src/game/entity/entity.ts";
import {
    createChunkMapComponent,
    ChunkMapComponentId,
    indexEntity,
} from "../../../../../../../src/game/component/chunkMapComponent.ts";
import { createProductionComponent } from "../../../../../../../src/game/component/productionComponent.ts";
import { forresterApplicability } from "../../../../../../../src/game/interaction/state/building/placement/applicability/forresterApplicability.ts";
import { forresterProduction } from "../../../../../../../src/data/production/productionDefinition.ts";

/**
 * Register an entity into the chunk map at its current worldPosition
 * so that queryEntity can find it.
 */
function registerInChunkMap(world: Entity, entity: Entity): void {
    indexEntity(
        world.requireEcsComponent(ChunkMapComponentId).chunkMap,
        entity,
    );
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
            createProductionComponent("forrester_production"),
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
            createProductionComponent("forrester_production"),
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
            createProductionComponent("forrester_production"),
        );
        registerInChunkMap(world, existingForrester);

        const result = forresterApplicability({ x: 10, y: 10 }, world);

        assert.strictEqual(result.isApplicable, false);
    });

    it("ignores non-forrester production buildings nearby", () => {
        const world = createWorld();

        // A different production building within radius should not block placement
        const otherProduction = new Entity("otherProduction");
        otherProduction.worldPosition = { x: 12, y: 10 };
        otherProduction.setEcsComponent(
            createProductionComponent("unknown_production"),
        );
        registerInChunkMap(world, otherProduction);

        const result = forresterApplicability({ x: 10, y: 10 }, world);

        assert.strictEqual(result.isApplicable, true);
    });
});

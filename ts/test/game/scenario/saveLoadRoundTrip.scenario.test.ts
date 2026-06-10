import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import { PersistenceManager } from "../../../src/server/persistence/persistenceManager.ts";
import { TestAdapter } from "../../server/persistence/testAdapter.ts";
import { stockPile } from "../../../src/data/building/wood/storage.ts";
import {
    ChunkMapComponentId,
    getEntitiesAt,
} from "../../../src/game/component/chunkMapComponent.ts";
import type { Entity } from "../../../src/game/entity/entity.ts";
import {
    assertChunkMapMatchesTree,
    assertTransformsConsistent,
} from "../worldInvariants.ts";

/**
 * Saves a world populated through the real prefabs and loads it into a
 * fresh harness, asserting the loaded world is spatially equivalent:
 * every entity keeps its world position, transforms stay consistent, and
 * the (runtime-only, rebuilt) chunk map answers queries the same way.
 */
describe("save and load round trip", () => {
    function collectWorldPositions(
        entity: Entity,
        into: Map<string, { x: number; y: number }>,
    ) {
        for (const child of entity.children) {
            into.set(child.id, child.worldPosition);
            collectWorldPositions(child, into);
        }
    }

    async function buildSaveAndLoad(): Promise<{
        savedPositions: Map<string, { x: number; y: number }>;
        loadHarness: ScenarioHarness;
        worker: Entity;
    }> {
        const harness = new ScenarioHarness();
        const kingdom = harness.addPlayerKingdom();
        harness.addPlayerBuilding(kingdom, stockPile, { x: 10, y: 9 }, "stockpile-1");
        const worker = harness.addWorker("worker-1", { x: 9, y: 9 });
        harness.addGoblinCamp({ x: 20, y: 18 });

        const savedPositions = new Map<string, { x: number; y: number }>();
        collectWorldPositions(harness.root, savedPositions);

        const manager = new PersistenceManager(new TestAdapter());
        await manager.saveWorld(harness.root);
        await manager.saveMeta({
            version: 1,
            tick: 0,
            seed: 1,
            idCounters: {},
        });

        const loadHarness = new ScenarioHarness();
        const loaded = await manager.load(loadHarness.root);
        assert.ok(loaded, "should successfully load the save");

        return { savedPositions, loadHarness, worker };
    }

    it("restores every entity at its saved world position", async () => {
        const { savedPositions, loadHarness } = await buildSaveAndLoad();

        assert.ok(savedPositions.size > 0);
        for (const [id, position] of savedPositions) {
            const entity = loadHarness.root.findEntity(id);
            assert.ok(entity, `entity ${id} should exist after load`);
            assert.deepStrictEqual(
                entity.worldPosition,
                position,
                `entity ${id} should keep its world position across the round trip`,
            );
        }
    });

    it("keeps transforms consistent in the loaded tree", async () => {
        const { loadHarness } = await buildSaveAndLoad();

        assertTransformsConsistent(loadHarness.root);
    });

    it("rebuilds the chunk map to answer queries like before the save", async () => {
        const { loadHarness, worker } = await buildSaveAndLoad();

        assertChunkMapMatchesTree(loadHarness.root);

        const chunkMap =
            loadHarness.root.requireEcsComponent(ChunkMapComponentId).chunkMap;
        const found = getEntitiesAt(chunkMap, 9, 9);
        assert.ok(
            found.some((entity) => entity.id === worker.id),
            "the worker should be reachable through the rebuilt chunk map",
        );
    });
});

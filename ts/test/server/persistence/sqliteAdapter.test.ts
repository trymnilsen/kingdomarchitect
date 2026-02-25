import assert from "node:assert";
import { describe, it, beforeEach } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { SQLiteAdapter } from "../../../src/server/persistence/sqliteAdapter.ts";
import { applySQLiteMigrations } from "../../../src/server/persistence/sqliteMigrationCompiler.ts";
import { gameMigrations } from "../../../src/server/persistence/migration.ts";
import type { SerializedEntity } from "../../../src/server/persistence/serializedEntity.ts";
import type { SerializedWorldMeta } from "../../../src/server/persistence/serializedWorldMeta.ts";

function createTestAdapter(): { adapter: SQLiteAdapter; db: DatabaseSync } {
    const db = new DatabaseSync(":memory:");
    applySQLiteMigrations(db, gameMigrations);
    const adapter = new SQLiteAdapter(db);
    return { adapter, db };
}

function makeEntity(
    id: string,
    parentId: string | null,
    x: number,
    y: number,
): SerializedEntity {
    return {
        id,
        parentId,
        x,
        y,
        components: { health: { id: "health", current: 10, max: 10 } },
    };
}

describe("SQLiteAdapter", () => {
    let adapter: SQLiteAdapter;
    let db: DatabaseSync;

    beforeEach(() => {
        const result = createTestAdapter();
        adapter = result.adapter;
        db = result.db;
    });

    describe("hasSave", () => {
        it("returns false on empty database", async () => {
            assert.strictEqual(await adapter.hasSave(), false);
        });

        it("returns true after saving meta", async () => {
            await adapter.saveMeta({ version: 1, tick: 42, seed: 123 });
            assert.strictEqual(await adapter.hasSave(), true);
        });
    });

    describe("meta", () => {
        it("round-trips meta data", async () => {
            const meta: SerializedWorldMeta = {
                version: 1,
                tick: 100,
                seed: 42,
            };
            await adapter.saveMeta(meta);
            const loaded = await adapter.loadMeta();
            assert.deepStrictEqual(loaded, meta);
        });

        it("returns null when no meta exists", async () => {
            const loaded = await adapter.loadMeta();
            assert.strictEqual(loaded, null);
        });

        it("overwrites existing meta", async () => {
            await adapter.saveMeta({ version: 1, tick: 10, seed: 1 });
            await adapter.saveMeta({ version: 1, tick: 20, seed: 2 });
            const loaded = await adapter.loadMeta();
            assert.deepStrictEqual(loaded, {
                version: 1,
                tick: 20,
                seed: 2,
            });
        });
    });

    describe("entities", () => {
        it("round-trips a single entity", async () => {
            const entity = makeEntity("e1", null, 12, 8);
            await adapter.saveEntity(entity);
            const loaded = await adapter.loadEntities();
            assert.strictEqual(loaded.length, 1);
            assert.deepStrictEqual(loaded[0], entity);
        });

        it("saves multiple entities in a batch", async () => {
            const entities = [
                makeEntity("e1", null, 5, 10),
                makeEntity("e2", "e1", 15, 20),
                makeEntity("e3", "e1", 25, 30),
            ];
            await adapter.saveEntities(entities);
            const loaded = await adapter.loadEntities();
            assert.strictEqual(loaded.length, 3);
        });

        it("upserts entities with same ID", async () => {
            await adapter.saveEntity(makeEntity("e1", null, 5, 10));
            await adapter.saveEntity(makeEntity("e1", null, 99, 88));
            const loaded = await adapter.loadEntities();
            assert.strictEqual(loaded.length, 1);
            assert.strictEqual(loaded[0].x, 99);
            assert.strictEqual(loaded[0].y, 88);
        });

        it("deletes a specific entity", async () => {
            await adapter.saveEntities([
                makeEntity("e1", null, 5, 10),
                makeEntity("e2", null, 15, 20),
            ]);
            await adapter.deleteEntity("e1");
            const loaded = await adapter.loadEntities();
            assert.strictEqual(loaded.length, 1);
            assert.strictEqual(loaded[0].id, "e2");
        });

        it("clears all entities", async () => {
            await adapter.saveEntities([
                makeEntity("e1", null, 5, 10),
                makeEntity("e2", null, 15, 20),
            ]);
            await adapter.clearEntities();
            const loaded = await adapter.loadEntities();
            assert.strictEqual(loaded.length, 0);
        });

        it("preserves nested component data through JSON serialization", async () => {
            const entity: SerializedEntity = {
                id: "complex",
                parentId: null,
                x: 7,
                y: 3,
                components: {
                    inventory: {
                        id: "inventory",
                        items: [
                            { name: "sword", count: 1 },
                            { name: "potion", count: 5 },
                        ],
                        capacity: 10,
                    },
                    discovery: {
                        id: "discovery",
                        data: {
                            __type: "Map",
                            __data: { player: { discovered: true } },
                        },
                    },
                },
            };
            await adapter.saveEntity(entity);
            const loaded = await adapter.loadEntities();
            assert.deepStrictEqual(loaded[0], entity);
        });
    });

    describe("rootComponents", () => {
        it("round-trips root components", async () => {
            const components = {
                tiles: { id: "tiles", data: [1, 2, 3] },
                discovery: { id: "discovery", players: ["p1"] },
            };
            await adapter.saveRootComponents(components);
            const loaded = await adapter.loadRootComponents();
            assert.deepStrictEqual(loaded, components);
        });

        it("returns null when no root components exist", async () => {
            const loaded = await adapter.loadRootComponents();
            assert.strictEqual(loaded, null);
        });
    });

    describe("clearGame", () => {
        it("clears all data", async () => {
            await adapter.saveMeta({ version: 1, tick: 10, seed: 1 });
            await adapter.saveEntity(makeEntity("e1", null, 5, 10));
            await adapter.saveRootComponents({ test: { id: "test" } });

            await adapter.clearGame();

            assert.strictEqual(await adapter.hasSave(), false);
            assert.strictEqual(await adapter.loadMeta(), null);
            assert.deepStrictEqual(await adapter.loadEntities(), []);
            assert.strictEqual(await adapter.loadRootComponents(), null);
        });
    });
});

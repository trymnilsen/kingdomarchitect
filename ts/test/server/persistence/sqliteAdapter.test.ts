import assert from "node:assert";
import { describe, it, beforeEach } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { SQLiteAdapter } from "../../../src/server/persistence/sqliteAdapter.ts";
import { applySQLiteMigrations } from "../../../src/server/persistence/sqliteMigrationCompiler.ts";
import { gameMigrations } from "../../../src/server/persistence/migration.ts";
import type { SerializedEntity } from "../../../src/server/persistence/serializedEntity.ts";

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

    describe("meta", () => {
        it("overwrites existing meta", async () => {
            await adapter.saveMeta({
                version: 1,
                tick: 10,
                seed: 1,
                idCounters: {},
            });
            await adapter.saveMeta({
                version: 1,
                tick: 20,
                seed: 2,
                idCounters: {},
            });
            const loaded = await adapter.loadMeta();
            assert.deepStrictEqual(loaded, {
                version: 1,
                tick: 20,
                seed: 2,
                idCounters: {},
            });
        });
    });

    describe("entities", () => {
        it("upserts entities with same ID", async () => {
            await adapter.saveEntities([makeEntity("e1", null, 5, 10)]);
            await adapter.saveEntities([makeEntity("e1", null, 99, 88)]);
            const loaded = await adapter.loadEntities();
            assert.strictEqual(loaded.length, 1);
            assert.strictEqual(loaded[0].x, 99);
            assert.strictEqual(loaded[0].y, 88);
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
            await adapter.saveEntities([entity]);
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
    });

    describe("clearGame", () => {
        it("clears all data", async () => {
            await adapter.saveMeta({
                version: 1,
                tick: 10,
                seed: 1,
                idCounters: {},
            });
            await adapter.saveEntities([makeEntity("e1", null, 5, 10)]);
            await adapter.saveRootComponents({ test: { id: "test" } });

            await adapter.clearGame();

            assert.strictEqual(await adapter.hasSave(), false);
            assert.strictEqual(await adapter.loadMeta(), null);
            assert.deepStrictEqual(await adapter.loadEntities(), []);
            assert.strictEqual(await adapter.loadRootComponents(), null);
        });
    });
});

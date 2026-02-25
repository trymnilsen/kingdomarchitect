import assert from "node:assert";
import { describe, it } from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
    gameMigrations,
    type StoreMigration,
} from "../../../src/server/persistence/migration.ts";
import {
    applySQLiteMigrations,
    getSQLiteVersion,
} from "../../../src/server/persistence/sqliteMigrationCompiler.ts";

describe("SQLite Schema Migrations", () => {
    it("creates schema_version table and applies migrations", () => {
        const db = new DatabaseSync(":memory:");
        applySQLiteMigrations(db, gameMigrations);

        const version = getSQLiteVersion(db);
        assert.strictEqual(version, 1, "Should be at version 1");

        // Verify tables were created
        const tables = db
            .prepare(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
            )
            .all() as Array<{ name: string }>;

        const tableNames = tables.map((t) => t.name);
        assert.ok(tableNames.includes("entities"), "entities table should exist");
        assert.ok(tableNames.includes("meta"), "meta table should exist");
        assert.ok(
            tableNames.includes("root_components"),
            "root_components table should exist",
        );
        assert.ok(
            tableNames.includes("schema_version"),
            "schema_version table should exist",
        );

        db.close();
    });

    it("creates indexes defined in migration operations", () => {
        const db = new DatabaseSync(":memory:");
        applySQLiteMigrations(db, gameMigrations);

        const indexes = db
            .prepare(
                "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'",
            )
            .all() as Array<{ name: string }>;

        const indexNames = indexes.map((i) => i.name);
        assert.ok(
            indexNames.includes("idx_entities_parentId"),
            "parentId index should exist",
        );

        db.close();
    });

    it("is idempotent when run multiple times", () => {
        const db = new DatabaseSync(":memory:");
        applySQLiteMigrations(db, gameMigrations);
        applySQLiteMigrations(db, gameMigrations);

        const version = getSQLiteVersion(db);
        assert.strictEqual(version, 1, "Version should still be 1");

        db.close();
    });

    it("applies migrations in version order", () => {
        const testMigrations: StoreMigration[] = [
            {
                version: 2,
                description: "Second migration",
                operations: [
                    {
                        type: "createStore",
                        name: "t2",
                        columns: [{ name: "id", type: "text", primaryKey: true }],
                    },
                ],
            },
            {
                version: 1,
                description: "First migration",
                operations: [
                    {
                        type: "createStore",
                        name: "t1",
                        keyPath: "id",
                        columns: [
                            { name: "id", type: "text", primaryKey: true },
                        ],
                    },
                ],
            },
            {
                version: 3,
                description: "Third migration",
                operations: [
                    {
                        type: "createStore",
                        name: "t3",
                        columns: [{ name: "id", type: "text", primaryKey: true }],
                    },
                ],
            },
        ];

        const db = new DatabaseSync(":memory:");
        applySQLiteMigrations(db, testMigrations);

        // All tables should exist regardless of definition order
        const tables = db
            .prepare(
                "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('t1','t2','t3') ORDER BY name",
            )
            .all() as Array<{ name: string }>;

        assert.deepStrictEqual(
            tables.map((t) => t.name),
            ["t1", "t2", "t3"],
            "All three tables should be created",
        );
        assert.strictEqual(getSQLiteVersion(db), 3);

        db.close();
    });

    it("skips already-applied migrations", () => {
        const migration1: StoreMigration = {
            version: 1,
            description: "First",
            operations: [
                {
                    type: "createStore",
                    name: "t1",
                    columns: [
                        { name: "id", type: "text", primaryKey: true },
                    ],
                },
            ],
        };
        const migration2: StoreMigration = {
            version: 2,
            description: "Second",
            operations: [
                {
                    type: "createStore",
                    name: "t2",
                    columns: [{ name: "id", type: "text", primaryKey: true }],
                },
            ],
        };

        const db = new DatabaseSync(":memory:");
        applySQLiteMigrations(db, [migration1]);
        assert.strictEqual(getSQLiteVersion(db), 1);

        // Now apply both — only migration 2 should run
        applySQLiteMigrations(db, [migration1, migration2]);
        assert.strictEqual(getSQLiteVersion(db), 2);

        // Both tables should exist
        const tables = db
            .prepare(
                "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('t1','t2') ORDER BY name",
            )
            .all() as Array<{ name: string }>;

        assert.deepStrictEqual(
            tables.map((t) => t.name),
            ["t1", "t2"],
        );

        db.close();
    });

    it("returns version 0 for empty database", () => {
        const db = new DatabaseSync(":memory:");
        const version = getSQLiteVersion(db);
        assert.strictEqual(version, 0);
        db.close();
    });

    it("compiles addColumn to ALTER TABLE", () => {
        const migrations: StoreMigration[] = [
            {
                version: 1,
                description: "Create base table",
                operations: [
                    {
                        type: "createStore",
                        name: "items",
                        columns: [
                            { name: "id", type: "text", primaryKey: true },
                            { name: "name", type: "text", notNull: true },
                        ],
                    },
                ],
            },
            {
                version: 2,
                description: "Add weight column",
                operations: [
                    {
                        type: "addColumn",
                        store: "items",
                        column: {
                            name: "weight",
                            type: "real",
                            defaultValue: "0",
                        },
                    },
                ],
            },
        ];

        const db = new DatabaseSync(":memory:");
        applySQLiteMigrations(db, migrations);

        // Insert a row using the new column
        db.prepare(
            "INSERT INTO items (id, name, weight) VALUES (?, ?, ?)",
        ).run("sword", "Iron Sword", 3.5);

        const row = db.prepare("SELECT * FROM items WHERE id = ?").get("sword") as {
            id: string;
            name: string;
            weight: number;
        };

        assert.strictEqual(row.weight, 3.5);
        assert.strictEqual(getSQLiteVersion(db), 2);

        db.close();
    });

    it("applies sqlOnly operations in SQLite", () => {
        const migrations: StoreMigration[] = [
            {
                version: 1,
                description: "Game store plus a SQL-only auth store",
                operations: [
                    {
                        type: "createStore",
                        name: "data",
                        columns: [
                            { name: "id", type: "text", primaryKey: true },
                        ],
                    },
                    {
                        type: "createStore",
                        sqlOnly: true,
                        name: "auth",
                        columns: [
                            { name: "token", type: "text", primaryKey: true },
                        ],
                    },
                ],
            },
        ];

        const db = new DatabaseSync(":memory:");
        applySQLiteMigrations(db, migrations);

        const tables = db
            .prepare(
                "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('data','auth') ORDER BY name",
            )
            .all() as Array<{ name: string }>;

        assert.deepStrictEqual(
            tables.map((t) => t.name),
            ["auth", "data"],
            "Both regular and sqlOnly stores should be created in SQLite",
        );
        assert.strictEqual(getSQLiteVersion(db), 1);

        db.close();
    });
});

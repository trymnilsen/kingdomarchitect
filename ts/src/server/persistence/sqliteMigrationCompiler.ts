import type { DatabaseSync } from "node:sqlite";
import type { MigrationOp, StoreMigration } from "./migration.ts";

function compileCreateTable(
    op: Extract<MigrationOp, { type: "createStore" }>,
): string {
    const columnDefs = op.columns.map((col) => {
        let def = `${col.name} ${col.type.toUpperCase()}`;
        if (col.primaryKey) {
            def += " PRIMARY KEY";
        }
        if (col.notNull) {
            def += " NOT NULL";
        }
        if (col.defaultValue !== undefined) {
            def += ` DEFAULT ${col.defaultValue}`;
        }
        return def;
    });

    return `CREATE TABLE ${op.name} (${columnDefs.join(", ")})`;
}

function compileSQLiteOp(op: MigrationOp): string {
    switch (op.type) {
        case "createStore": {
            const statements = [compileCreateTable(op)];
            if (op.indexes) {
                for (const idx of op.indexes) {
                    const uniqueClause = idx.unique ? "UNIQUE " : "";
                    statements.push(
                        `CREATE ${uniqueClause}INDEX idx_${op.name}_${idx.name} ON ${op.name}(${idx.keyPath})`,
                    );
                }
            }
            return statements.join(";\n");
        }
        case "addColumn": {
            const col = op.column;
            let def = `ALTER TABLE ${op.store} ADD COLUMN ${col.name} ${col.type.toUpperCase()}`;
            if (col.notNull && col.defaultValue !== undefined) {
                def += ` NOT NULL DEFAULT ${col.defaultValue}`;
            } else if (col.defaultValue !== undefined) {
                def += ` DEFAULT ${col.defaultValue}`;
            }
            return def;
        }
        case "removeColumn":
            return `ALTER TABLE ${op.store} DROP COLUMN ${op.column}`;
    }
}

/**
 * Applies declarative migrations to a SQLite database.
 * Each migration runs in its own transaction.
 */
export function applySQLiteMigrations(
    db: DatabaseSync,
    migrations: StoreMigration[],
): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER NOT NULL
        )
    `);

    let currentVersion = getSQLiteVersion(db);
    const sorted = [...migrations].sort((a, b) => a.version - b.version);

    for (const migration of sorted) {
        if (migration.version <= currentVersion) {
            continue;
        }

        db.exec("BEGIN");
        try {
            for (const op of migration.operations) {
                db.exec(compileSQLiteOp(op));
            }

            if (currentVersion === 0) {
                db.prepare(
                    "INSERT INTO schema_version (version) VALUES (?)",
                ).run(migration.version);
            } else {
                db.prepare("UPDATE schema_version SET version = ?").run(
                    migration.version,
                );
            }
            currentVersion = migration.version;
            db.exec("COMMIT");
        } catch (err) {
            db.exec("ROLLBACK");
            throw err;
        }
    }
}

/**
 * Returns the current schema version from a SQLite database, or 0 if none.
 */
export function getSQLiteVersion(db: DatabaseSync): number {
    const tableExists = db
        .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'",
        )
        .get();

    if (!tableExists) {
        return 0;
    }

    const row = db.prepare("SELECT version FROM schema_version").get() as
        | { version: number }
        | undefined;

    return row?.version ?? 0;
}

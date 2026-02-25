import { DatabaseSync } from "node:sqlite";
import type { PersistenceAdapter } from "./persistenceAdapter.ts";
import type { SerializedEntity } from "./serializedEntity.ts";
import type { SerializedWorldMeta } from "./serializedWorldMeta.ts";
import { gameMigrations } from "./migration.ts";
import { applySQLiteMigrations } from "./sqliteMigrationCompiler.ts";

/**
 * SQLite-backed persistence adapter for the multiplayer server.
 * Accepts a pre-initialized DatabaseSync instance so the database
 * can be shared with other subsystems (e.g. auth).
 */
export class SQLiteAdapter implements PersistenceAdapter {
    private db: DatabaseSync;

    constructor(db: DatabaseSync) {
        this.db = db;
    }

    async hasSave(): Promise<boolean> {
        const row = this.db
            .prepare("SELECT value FROM meta WHERE key = 'world_meta'")
            .get();
        return row !== undefined;
    }

    async loadMeta(): Promise<SerializedWorldMeta | null> {
        const row = this.db
            .prepare("SELECT value FROM meta WHERE key = 'world_meta'")
            .get() as { value: string } | undefined;

        if (!row) {
            return null;
        }
        return JSON.parse(row.value) as SerializedWorldMeta;
    }

    async saveMeta(meta: SerializedWorldMeta): Promise<void> {
        this.db
            .prepare(
                "INSERT OR REPLACE INTO meta (key, value) VALUES ('world_meta', ?)",
            )
            .run(JSON.stringify(meta));
    }

    async saveEntity(entity: SerializedEntity): Promise<void> {
        this.db
            .prepare(
                `INSERT OR REPLACE INTO entities (id, parent_id, x, y, components)
                 VALUES (?, ?, ?, ?, ?)`,
            )
            .run(
                entity.id,
                entity.parentId,
                entity.x,
                entity.y,
                JSON.stringify(entity.components),
            );
    }

    async saveEntities(entities: SerializedEntity[]): Promise<void> {
        const stmt = this.db.prepare(
            `INSERT OR REPLACE INTO entities (id, parent_id, x, y, components)
             VALUES (?, ?, ?, ?, ?)`,
        );

        this.db.exec("BEGIN");
        try {
            for (const entity of entities) {
                stmt.run(
                    entity.id,
                    entity.parentId,
                    entity.x,
                    entity.y,
                    JSON.stringify(entity.components),
                );
            }
            this.db.exec("COMMIT");
        } catch (err) {
            this.db.exec("ROLLBACK");
            throw err;
        }
    }

    async loadEntities(): Promise<SerializedEntity[]> {
        const rows = this.db.prepare("SELECT * FROM entities").all() as Array<{
            id: string;
            parent_id: string | null;
            x: number;
            y: number;
            components: string;
        }>;

        return rows.map((row) => ({
            id: row.id,
            parentId: row.parent_id,
            x: row.x,
            y: row.y,
            components: JSON.parse(row.components),
        }));
    }

    async deleteEntity(entityId: string): Promise<void> {
        this.db.prepare("DELETE FROM entities WHERE id = ?").run(entityId);
    }

    async clearEntities(): Promise<void> {
        this.db.exec("DELETE FROM entities");
    }

    async saveRootComponents(components: Record<string, any>): Promise<void> {
        this.db
            .prepare(
                "INSERT OR REPLACE INTO root_components (key, value) VALUES ('components', ?)",
            )
            .run(JSON.stringify(components));
    }

    async loadRootComponents(): Promise<Record<string, any> | null> {
        const row = this.db
            .prepare(
                "SELECT value FROM root_components WHERE key = 'components'",
            )
            .get() as { value: string } | undefined;

        if (!row) {
            return null;
        }
        return JSON.parse(row.value);
    }

    async clearGame(): Promise<void> {
        this.db.exec("BEGIN");
        try {
            this.db.exec("DELETE FROM entities");
            this.db.exec("DELETE FROM meta");
            this.db.exec("DELETE FROM root_components");
            this.db.exec("COMMIT");
        } catch (err) {
            this.db.exec("ROLLBACK");
            throw err;
        }
    }

    close(): void {
        this.db.close();
    }
}

/**
 * Convenience factory that creates a SQLite database at the given path,
 * configures WAL mode, runs persistence migrations, and returns an adapter.
 */
export function createSQLiteAdapter(dbPath: string): SQLiteAdapter {
    const db = new DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode=WAL");
    db.exec("PRAGMA synchronous=NORMAL");
    applySQLiteMigrations(db, gameMigrations);
    return new SQLiteAdapter(db);
}

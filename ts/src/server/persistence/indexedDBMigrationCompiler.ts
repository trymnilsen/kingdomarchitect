import type { MigrationOp, StoreMigration } from "./migration.ts";

/**
 * Applies declarative migrations within an IndexedDB onupgradeneeded callback.
 * Called with the db, the upgrade transaction, and the version range to apply.
 */
export function applyIndexedDBMigrations(
    db: IDBDatabase,
    tx: IDBTransaction,
    oldVersion: number,
    migrations: StoreMigration[],
): void {
    const sorted = [...migrations].sort((a, b) => a.version - b.version);

    for (const migration of sorted) {
        if (migration.version <= oldVersion) {
            continue;
        }

        for (const op of migration.operations) {
            applyIndexedDBOp(db, tx, op);
        }
    }
}

function applyIndexedDBOp(
    db: IDBDatabase,
    _tx: IDBTransaction,
    op: MigrationOp,
): void {
    switch (op.type) {
        case "createStore": {
            if (op.sqlOnly) {
                return;
            }
            const storeOpts: IDBObjectStoreParameters = {};
            if (op.keyPath) {
                storeOpts.keyPath = op.keyPath;
            }
            const store = db.createObjectStore(op.name, storeOpts);
            if (op.indexes) {
                for (const idx of op.indexes) {
                    store.createIndex(idx.name, idx.keyPath, {
                        unique: idx.unique ?? false,
                    });
                }
            }
            break;
        }
        case "addColumn":
        case "removeColumn":
            // No-op — IndexedDB stores are schemaless
            break;
    }
}

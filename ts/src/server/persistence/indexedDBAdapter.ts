import type { PersistenceAdapter } from "./persistenceAdapter.ts";
import type { SerializedEntity } from "./serializedEntity.ts";
import type { SerializedWorldMeta } from "./serializedWorldMeta.ts";

const DB_NAME = "kingdom_architect";
const DB_VERSION = 1;
const ENTITY_STORE = "entities";
const META_STORE = "meta";
const META_KEY = "world_meta";

/**
 * IndexedDB implementation of the PersistenceAdapter.
 * Uses batched transactions for efficient saving of large entity counts.
 */
export class IndexedDBAdapter implements PersistenceAdapter {
    private db: IDBDatabase | null = null;

    /**
     * Initialize the IndexedDB connection
     */
    async init(): Promise<void> {
        if (this.db) {
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new Error("Failed to open IndexedDB"));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create entities store if it doesn't exist
                if (!db.objectStoreNames.contains(ENTITY_STORE)) {
                    const entityStore = db.createObjectStore(ENTITY_STORE, {
                        keyPath: "id",
                    });
                    // Create index on parentId for efficient child queries
                    entityStore.createIndex("parentId", "parentId", {
                        unique: false,
                    });
                }

                // Create meta store if it doesn't exist
                if (!db.objectStoreNames.contains(META_STORE)) {
                    db.createObjectStore(META_STORE);
                }
            };
        });
    }

    /**
     * Ensure the database is initialized
     */
    private async ensureDb(): Promise<IDBDatabase> {
        if (!this.db) {
            await this.init();
        }
        if (!this.db) {
            throw new Error("Database not initialized");
        }
        return this.db;
    }

    async hasSave(): Promise<boolean> {
        const meta = await this.loadMeta();
        return meta !== null;
    }

    async loadMeta(): Promise<SerializedWorldMeta | null> {
        const db = await this.ensureDb();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([META_STORE], "readonly");
            const store = transaction.objectStore(META_STORE);
            const request = store.get(META_KEY);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                reject(new Error("Failed to load metadata"));
            };
        });
    }

    async saveMeta(meta: SerializedWorldMeta): Promise<void> {
        const db = await this.ensureDb();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([META_STORE], "readwrite");
            const store = transaction.objectStore(META_STORE);
            const request = store.put(meta, META_KEY);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error("Failed to save metadata"));
            };
        });
    }

    async saveEntity(entity: SerializedEntity): Promise<void> {
        // Delegate to batch save for consistency
        await this.saveEntities([entity]);
    }

    async saveEntities(entities: SerializedEntity[]): Promise<void> {
        if (entities.length === 0) {
            return;
        }

        const db = await this.ensureDb();

        return new Promise((resolve, reject) => {
            // Use a single transaction for all writes
            const transaction = db.transaction([ENTITY_STORE], "readwrite");
            const store = transaction.objectStore(ENTITY_STORE);

            let completedCount = 0;
            let hasError = false;

            for (const entity of entities) {
                const request = store.put(entity);

                request.onsuccess = () => {
                    completedCount++;
                    if (completedCount === entities.length && !hasError) {
                        resolve();
                    }
                };

                request.onerror = () => {
                    if (!hasError) {
                        hasError = true;
                        reject(new Error(`Failed to save entity ${entity.id}`));
                    }
                };
            }

            // Handle transaction completion
            transaction.oncomplete = () => {
                if (!hasError && completedCount === entities.length) {
                    resolve();
                }
            };

            transaction.onerror = () => {
                if (!hasError) {
                    hasError = true;
                    reject(new Error("Transaction failed"));
                }
            };
        });
    }

    async loadEntities(): Promise<SerializedEntity[]> {
        const db = await this.ensureDb();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([ENTITY_STORE], "readonly");
            const store = transaction.objectStore(ENTITY_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(new Error("Failed to load entities"));
            };
        });
    }

    async deleteEntity(entityId: string): Promise<void> {
        const db = await this.ensureDb();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([ENTITY_STORE], "readwrite");
            const store = transaction.objectStore(ENTITY_STORE);
            const request = store.delete(entityId);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error(`Failed to delete entity ${entityId}`));
            };
        });
    }

    /**
     * Close the database connection
     */
    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    async clearGame(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.close();
            const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
            deleteRequest.onsuccess = () => {
                resolve();
            };

            deleteRequest.onerror = (err) => {
                reject(err);
            };
        });
    }
}

import type { PersistenceAdapter } from "../../../src/server/persistence/persistenceAdapter.ts";
import type { SerializedEntity } from "../../../src/server/persistence/serializedEntity.ts";
import type { SerializedWorldMeta } from "../../../src/server/persistence/serializedWorldMeta.ts";

/**
 * In-memory test adapter for persistence testing.
 * Stores all data in simple arrays/objects for fast, synchronous testing.
 */
export class TestAdapter implements PersistenceAdapter {
    private entities: SerializedEntity[] = [];
    private meta: SerializedWorldMeta | null = null;
    private rootComponents: Record<string, any> | null = null;

    async hasSave(): Promise<boolean> {
        return this.meta !== null;
    }

    async loadMeta(): Promise<SerializedWorldMeta | null> {
        return this.meta;
    }

    async saveMeta(meta: SerializedWorldMeta): Promise<void> {
        this.meta = meta;
    }

    async saveEntity(entity: SerializedEntity): Promise<void> {
        const existingIndex = this.entities.findIndex((e) => e.id === entity.id);
        if (existingIndex >= 0) {
            this.entities[existingIndex] = entity;
        } else {
            this.entities.push(entity);
        }
    }

    async saveEntities(entities: SerializedEntity[]): Promise<void> {
        for (const entity of entities) {
            await this.saveEntity(entity);
        }
    }

    async loadEntities(): Promise<SerializedEntity[]> {
        return [...this.entities];
    }

    async deleteEntity(entityId: string): Promise<void> {
        this.entities = this.entities.filter((e) => e.id !== entityId);
    }

    async clearEntities(): Promise<void> {
        this.entities = [];
    }

    async saveRootComponents(components: Record<string, any>): Promise<void> {
        this.rootComponents = components;
    }

    async loadRootComponents(): Promise<Record<string, any> | null> {
        return this.rootComponents;
    }

    async clearGame(): Promise<void> {
        this.entities = [];
        this.meta = null;
        this.rootComponents = null;
    }

    getStoredEntities(): SerializedEntity[] {
        return [...this.entities];
    }

    getStoredRootComponents(): Record<string, any> | null {
        return this.rootComponents;
    }
}

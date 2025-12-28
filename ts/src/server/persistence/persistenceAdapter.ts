import type { SerializedEntity } from "./serializedEntity.js";
import type { SerializedWorldMeta } from "./serializedWorldMeta.js";

/**
 * Interface for persistence adapters that handle saving and loading game state.
 * Implementations should support batched operations for performance with large entity counts.
 */
export interface PersistenceAdapter {
    /**
     * Check if a save file exists
     */
    hasSave(): Promise<boolean>;

    /**
     * Load world metadata from storage
     * @returns World metadata or null if no save exists
     */
    loadMeta(): Promise<SerializedWorldMeta | null>;

    /**
     * Save world metadata to storage
     */
    saveMeta(meta: SerializedWorldMeta): Promise<void>;

    /**
     * Save a single entity to storage
     * @param entity The entity to save
     */
    saveEntity(entity: SerializedEntity): Promise<void>;

    /**
     * Save multiple entities in a single batched transaction
     * This is the preferred method for saving multiple entities for performance
     * @param entities The entities to save
     */
    saveEntities(entities: SerializedEntity[]): Promise<void>;

    /**
     * Load all entities from storage
     * @returns Array of all saved entities
     */
    loadEntities(): Promise<SerializedEntity[]>;

    /**
     * Delete a single entity from storage
     * @param entityId The ID of the entity to delete
     */
    deleteEntity(entityId: string): Promise<void>;
}

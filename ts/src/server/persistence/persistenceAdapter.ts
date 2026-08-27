import type { SerializedEntity } from "./serializedEntity.ts";
import type { SerializedWorldMeta } from "./serializedWorldMeta.ts";

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
     * Save entities in a single batched transaction
     * @param entities The entities to save
     */
    saveEntities(entities: SerializedEntity[]): Promise<void>;

    /**
     * Load all entities from storage
     * @returns Array of all saved entities
     */
    loadEntities(): Promise<SerializedEntity[]>;

    /**
     * Clear all entities from storage.
     * Used before a full world save to remove stale entities.
     */
    clearEntities(): Promise<void>;

    /**
     * Save root entity components (world-level data like tiles and discovery)
     * Separate from entity tree to allow different storage strategies
     * @param components Serialized root components keyed by component ID
     */
    saveRootComponents(components: Record<string, any>): Promise<void>;

    /**
     * Load root entity components
     * @returns The saved root components or null if none exist
     */
    loadRootComponents(): Promise<Record<string, any> | null>;

    clearGame(): Promise<void>;
}

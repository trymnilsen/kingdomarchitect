# Persistence Module

The persistence module provides entity-level persistence for Kingdom Architect with support for:

- **Entity-level persistence**: Save individual entities or collections
- **Subtree saves**: Recursively save an entity and all its descendants
- **Partial/incremental saves**: Save only specific entities that have changed
- **Batched saving**: Efficient saving of large numbers of entities using transactions

## Architecture

The module consists of:

- **PersistenceManager**: High-level API for saving and loading game state
- **PersistenceAdapter**: Interface for storage backends
- **IndexedDBAdapter**: IndexedDB implementation with transaction batching
- **Types**: TypeScript interfaces for serialized data

## Usage

### Initialization

```typescript
import { PersistenceManager, IndexedDBAdapter } from "./persistence/index.ts";

// Create adapter and initialize
const adapter = new IndexedDBAdapter();
await adapter.init();

// Create persistence manager
const persistenceManager = new PersistenceManager(adapter);
```

### Saving Game State

#### Save specific entities

```typescript
// Save specific entities by ID
const entityIds = ["entity1", "entity2", "entity3"];
await persistenceManager.saveEntities(world.root, entityIds);

// Save metadata (tick, seed, version)
await persistenceManager.saveMeta({
    version: 1,
    tick: gameServer.currentTick,
    seed: worldSeed,
});
```

#### Save an entity subtree

```typescript
// Save an entity and all its children recursively
const villageId = "village_1";
await persistenceManager.saveSubtree(world.root, villageId);
```

#### Batch save for performance

```typescript
// When saving many entities, collect them and save in one call
// This uses a single IndexedDB transaction internally
const dirtyEntityIds = getDirtyEntities(); // Your dirty tracking
await persistenceManager.saveEntities(world.root, dirtyEntityIds);
```

### Loading Game State

```typescript
// Check if save exists
if (await persistenceManager.hasSave()) {
    // Load metadata
    const meta = await persistenceManager.loadMeta();
    console.log(`Loading save from tick ${meta.tick}`);

    // Load all entities and restore hierarchy
    const loaded = await persistenceManager.load(world.root);
    
    if (loaded) {
        // Resume simulation at saved tick
        gameTime.setTick(meta.tick);
    }
}
```

### Deleting Entities

```typescript
// Delete a single entity from storage
await persistenceManager.deleteEntity("entity_id");
```

## Data Format

### SerializedWorldMeta

```typescript
interface SerializedWorldMeta {
    version: number;  // Save format version
    tick: number;     // Game tick when saved
    seed: number;     // World generation seed
}
```

### SerializedEntity

```typescript
interface SerializedEntity {
    id: string;                      // Entity ID
    parentId: string | null;         // Parent entity ID (null for root-level)
    x: number;                       // World X position
    y: number;                       // World Y position
    components: Record<string, any>; // All components as key-value pairs
}
```

## Storage Backend

### IndexedDB

The IndexedDB adapter uses:

- **Database**: `kingdom_architect`
- **Object Stores**:
  - `entities`: Stores all entity data (keyed by entity ID)
  - `meta`: Stores world metadata
- **Indexes**: `parentId` index on entities for efficient child queries

### Batching Strategy

All write operations use transactions:

- `saveEntities()`: Single transaction for all entities
- `saveEntity()`: Delegates to `saveEntities([entity])`
- `saveSubtree()`: Collects all descendants, then single transaction

This ensures:
- Atomicity: All entities saved or none
- Performance: Minimal transaction overhead
- Consistency: No partial saves

## Future: SQLite Support

The design is compatible with future SQLite adaptation:

```sql
CREATE TABLE entities (
    entity_id TEXT PRIMARY KEY,
    parent_id TEXT,
    x REAL,
    y REAL,
    components TEXT  -- JSON serialized
);
```

Batched saves would use:
```sql
BEGIN TRANSACTION;
INSERT OR REPLACE INTO entities VALUES (?, ?, ?, ?, ?);
-- ... multiple inserts ...
COMMIT;
```

## Integration with GameServer

Example integration in `gameServer.ts`:

```typescript
export class GameServer {
    private world: EcsWorld;
    private persistenceManager: PersistenceManager;
    private dirtyEntities = new Set<string>();

    async init() {
        // Initialize persistence
        const adapter = new IndexedDBAdapter();
        await adapter.init();
        this.persistenceManager = new PersistenceManager(adapter);

        // Try to load existing save
        if (await this.persistenceManager.hasSave()) {
            const meta = await this.persistenceManager.loadMeta();
            await this.persistenceManager.load(this.world.root);
            this.updateTick = meta.tick;
        } else {
            // New game
            this.world.runInit();
        }
    }

    // Track dirty entities
    markDirty(entityId: string) {
        this.dirtyEntities.add(entityId);
    }

    // Periodic auto-save
    async autoSave() {
        if (this.dirtyEntities.size > 0) {
            const dirtyIds = Array.from(this.dirtyEntities);
            await this.persistenceManager.saveEntities(this.world.root, dirtyIds);
            await this.persistenceManager.saveMeta({
                version: 1,
                tick: this.updateTick,
                seed: this.worldSeed,
            });
            this.dirtyEntities.clear();
        }
    }
}
```

## Performance Considerations

- **Batching**: Always prefer `saveEntities()` over multiple `saveEntity()` calls
- **Deep cloning**: Components are deep-cloned using JSON serialization
- **Subtree saves**: Only use for logical groupings (villages, regions)
- **Load order**: Entity hierarchy is reconstructed after all entities are loaded
- **Large saves**: IndexedDB handles tens of thousands of entities efficiently

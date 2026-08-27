# Persistence

Saving and loading the world, behind a storage-agnostic adapter.

## Pieces

- `PersistenceManager` walks the entity tree, serializes it, and hands flat
  records to an adapter. It is the only thing the game server talks to.
- `PersistenceAdapter` is the storage interface: entities, world meta, and the
  root components that hold world-level data.
- `IndexedDBAdapter` backs singleplayer in the browser. `SQLiteAdapter` backs
  the multiplayer server.
- `migration.ts` declares the schema once. `sqliteMigrationCompiler.ts` turns it
  into DDL and `indexedDBMigrationCompiler.ts` into object stores. Operations
  marked `sqlOnly` (auth, sessions) are skipped by IndexedDB.

## What the game server does

`gameServer.ts` calls `hasSave()` on startup, then `loadMeta()` and
`load(root)` to restore, or runs world generation. Saving is whole-world:
`saveWorld(root)` clears the entity store and writes every entity plus the
persistable root components in one pass, followed by `saveMeta(...)`.

`exportWorld` / `importSave` serve the save-file download and upload in
`localServerConnection.ts`.

## Serialized shapes

`SerializedEntity` is `{ id, parentId, x, y, components }`, with the world
position flattened onto the record and components serialized by id.
`SerializedWorldMeta` carries the save version, the tick, and the world seed.
Maps and Sets survive the round trip as `{ __type, __data }` envelopes.

Load order matters: entities are written to the store flat, and the parent
links are reconnected after every entity has been read back.

## Development note

There is no migration path for saved games. The schema changes freely and old
saves break.

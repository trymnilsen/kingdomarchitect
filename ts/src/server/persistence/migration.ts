/**
 * Column type mapping for SQLite table creation.
 * IndexedDB is schemaless and ignores column types.
 */
export type ColumnType = "text" | "real" | "integer" | "blob";

export type ColumnDef = {
    name: string;
    type: ColumnType;
    primaryKey?: boolean;
    notNull?: boolean;
    defaultValue?: string;
};

export type IndexDef = {
    name: string;
    keyPath: string;
    unique?: boolean;
};

/**
 * Declarative migration operations that compile to both SQLite DDL
 * and IndexedDB store management.
 *
 * Operations marked `sqlOnly: true` are applied by the SQLite compiler
 * but skipped by the IndexedDB compiler. Use this for stores that only
 * exist in the multiplayer/server context (e.g. auth, sessions).
 */
export type MigrationOp =
    | {
          type: "createStore";
          name: string;
          keyPath?: string;
          columns: ColumnDef[];
          indexes?: IndexDef[];
          sqlOnly?: boolean;
      }
    | {
          type: "addColumn";
          store: string;
          column: ColumnDef;
          sqlOnly?: boolean;
      }
    | {
          type: "removeColumn";
          store: string;
          column: string;
      };

export type StoreMigration = {
    version: number;
    description: string;
    operations: MigrationOp[];
};

/**
 * Game schema migrations shared between IndexedDB and SQLite backends.
 */
export const gameMigrations: StoreMigration[] = [
    {
        version: 1,
        description: "Initial schema with entities, meta, and root_components",
        operations: [
            {
                type: "createStore",
                name: "entities",
                keyPath: "id",
                columns: [
                    { name: "id", type: "text", primaryKey: true },
                    { name: "parent_id", type: "text" },
                    { name: "x", type: "real", notNull: true },
                    { name: "y", type: "real", notNull: true },
                    { name: "components", type: "text", notNull: true },
                ],
                indexes: [
                    { name: "parentId", keyPath: "parent_id", unique: false },
                ],
            },
            {
                type: "createStore",
                name: "meta",
                columns: [
                    { name: "key", type: "text", primaryKey: true },
                    { name: "value", type: "text", notNull: true },
                ],
            },
            {
                type: "createStore",
                name: "root_components",
                columns: [
                    { name: "key", type: "text", primaryKey: true },
                    { name: "value", type: "text", notNull: true },
                ],
            },
        ],
    },
];

/**
 * Auth-related migrations. Marked `sqlOnly: true` because singleplayer
 * (IndexedDB) has no concept of users or sessions.
 */
export const authMigrations: StoreMigration[] = [
    {
        version: 2,
        description: "Add credentials and sessions tables for passkey auth",
        operations: [
            {
                type: "createStore",
                sqlOnly: true,
                name: "credentials",
                columns: [
                    { name: "credential_id", type: "text", primaryKey: true },
                    { name: "player_id", type: "text", notNull: true },
                    { name: "public_key", type: "blob", notNull: true },
                    {
                        name: "counter",
                        type: "integer",
                        notNull: true,
                        defaultValue: "0",
                    },
                    { name: "transports", type: "text" },
                    {
                        name: "created_at",
                        type: "text",
                        notNull: true,
                        defaultValue: "(datetime('now'))",
                    },
                ],
                indexes: [{ name: "player", keyPath: "player_id" }],
            },
            {
                type: "createStore",
                sqlOnly: true,
                name: "sessions",
                columns: [
                    { name: "session_id", type: "text", primaryKey: true },
                    { name: "player_id", type: "text", notNull: true },
                    {
                        name: "created_at",
                        type: "text",
                        notNull: true,
                        defaultValue: "(datetime('now'))",
                    },
                    { name: "expires_at", type: "text", notNull: true },
                ],
                indexes: [
                    { name: "player", keyPath: "player_id" },
                    { name: "expires", keyPath: "expires_at" },
                ],
            },
        ],
    },
];

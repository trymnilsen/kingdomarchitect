/**
 * Delta operations for component replication.
 *
 * Instead of sending full component snapshots on every change, the server
 * diffs the old and new component state and sends only the operations needed
 * to transform the client's copy. This matters for large components (e.g.
 * inventories, job queues) where a single field change would otherwise
 * retransmit the entire object.
 *
 * The operation set mirrors JS's native mutation capabilities: property
 * set/delete for objects, push/splice for arrays, and get/set/delete for
 * Map and Set. This keeps applyDelta simple — each operation maps directly
 * to a single JS mutation call.
 *
 * See diffComponent.ts for the diff side and applyDelta.ts for the apply side.
 */

import type { ComponentID } from "../../game/component/component.ts";

/**
 * A path to a property within a component.
 * Can be a mix of string keys and numeric indices.
 * Example: ["items", 0, "quantity"] for component.items[0].quantity
 */
export type PropertyPath = (string | number)[];

/**
 * Set a value at a path. Works for primitives, objects, or arrays.
 */
export type SetOperation = {
    op: "set";
    path: PropertyPath;
    value: unknown;
};

/**
 * Delete a property at a path.
 */
export type DeleteOperation = {
    op: "delete";
    path: PropertyPath;
};

/**
 * Push values to the end of an array.
 */
export type ArrayPushOperation = {
    op: "array_push";
    path: PropertyPath;
    values: unknown[];
};

/**
 * Splice an array: remove deleteCount items at index, optionally insert new items.
 */
export type ArraySpliceOperation = {
    op: "array_splice";
    path: PropertyPath;
    index: number;
    deleteCount: number;
    insert?: unknown[];
};

/**
 * Set a key in a Map.
 */
export type MapSetOperation = {
    op: "map_set";
    path: PropertyPath;
    key: string | number;
    value: unknown;
};

/**
 * Delete a key from a Map.
 */
export type MapDeleteOperation = {
    op: "map_delete";
    path: PropertyPath;
    key: string | number;
};

/**
 * Add a value to a Set.
 */
export type SetAddOperation = {
    op: "set_add";
    path: PropertyPath;
    value: unknown;
};

/**
 * Delete a value from a Set.
 */
export type SetDeleteOperation = {
    op: "set_delete";
    path: PropertyPath;
    value: unknown;
};

/**
 * Union of all delta operations.
 */
export type DeltaOperation =
    | SetOperation
    | DeleteOperation
    | ArrayPushOperation
    | ArraySpliceOperation
    | MapSetOperation
    | MapDeleteOperation
    | SetAddOperation
    | SetDeleteOperation;

/**
 * A delta update for a component, containing a list of operations
 * to transform the component from its previous state to its current state.
 */
export type ComponentDelta = {
    entityId: string;
    componentId: ComponentID;
    operations: DeltaOperation[];
};

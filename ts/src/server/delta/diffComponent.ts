import type { Components } from "../../game/component/component.ts";
import type {
    DeltaOperation,
    PropertyPath,
} from "./deltaTypes.ts";

/**
 * Compare the previous snapshot of a component to its current state and
 * produce the minimal set of DeltaOperations needed to transform one into
 * the other. The caller (replicatedEntitiesSystem) decides whether the
 * resulting delta is actually worth sending vs just sending the full
 * component — see isDeltaSmaller.
 *
 * The diff walks the object tree recursively. It relies on both values
 * being plain serializable data (the same shapes that persistence uses),
 * so it only needs to handle: primitives, plain objects, arrays, Maps,
 * and Sets. Class instances or functions will not appear in components.
 */
export function diffComponents(
    oldComponent: Components,
    newComponent: Components,
): DeltaOperation[] {
    const operations: DeltaOperation[] = [];
    diffValue(oldComponent, newComponent, [], operations);
    return operations;
}

/**
 * Recursively diff two values and append operations to the list.
 */
function diffValue(
    oldVal: unknown,
    newVal: unknown,
    path: PropertyPath,
    operations: DeltaOperation[],
): void {
    // Reference equality short-circuit. structuredClone in updateComponent
    // creates a deep copy, so identical references only happen for unchanged
    // subtrees that weren't cloned (e.g. frozen constants shared across ticks)
    if (oldVal === newVal) {
        return;
    }

    // Handle null/undefined transitions
    if (oldVal == null || newVal == null) {
        operations.push({ op: "set", path, value: newVal });
        return;
    }

    // Handle Map
    if (oldVal instanceof Map && newVal instanceof Map) {
        diffMap(oldVal, newVal, path, operations);
        return;
    }

    // Handle Set
    if (oldVal instanceof Set && newVal instanceof Set) {
        diffSet(oldVal, newVal, path, operations);
        return;
    }

    // Handle Array
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
        diffArray(oldVal, newVal, path, operations);
        return;
    }

    // Handle Object
    if (
        typeof oldVal === "object" &&
        typeof newVal === "object" &&
        !Array.isArray(oldVal) &&
        !Array.isArray(newVal)
    ) {
        diffObject(
            oldVal as Record<string, unknown>,
            newVal as Record<string, unknown>,
            path,
            operations,
        );
        return;
    }

    // Primitives that differ
    operations.push({ op: "set", path, value: newVal });
}

/**
 * Diff two plain objects.
 */
function diffObject(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
    path: PropertyPath,
    operations: DeltaOperation[],
): void {
    const oldKeys = new Set(Object.keys(oldObj));
    const newKeys = new Set(Object.keys(newObj));

    // Check for deleted keys
    for (const key of oldKeys) {
        if (!newKeys.has(key)) {
            operations.push({ op: "delete", path: [...path, key] });
        }
    }

    // Check for added or changed keys
    for (const key of newKeys) {
        const childPath = [...path, key];
        if (!oldKeys.has(key)) {
            // New key
            operations.push({ op: "set", path: childPath, value: newObj[key] });
        } else {
            // Existing key - recursively diff
            diffValue(oldObj[key], newObj[key], childPath, operations);
        }
    }
}

/**
 * Diff two arrays using index-based comparison. This intentionally avoids
 * LCS/edit-distance algorithms — they're O(n*m) and components rarely have
 * arrays where elements shift position. The common mutations are:
 *   1. Append (e.g. new job added to queue) → detected as array_push
 *   2. Truncate (e.g. items consumed) → detected as array_splice
 *   3. In-place update (e.g. quantity changed) → per-index set or recursive diff
 *
 * When more than 50% of elements differ, we bail out and send the whole
 * array as a single set operation, since at that point the delta overhead
 * exceeds the savings.
 */
function diffArray(
    oldArr: unknown[],
    newArr: unknown[],
    path: PropertyPath,
    operations: DeltaOperation[],
): void {
    const oldLen = oldArr.length;
    const newLen = newArr.length;

    // Check for pure append: new array starts with all of old array
    if (newLen > oldLen) {
        let isAppend = true;
        for (let i = 0; i < oldLen; i++) {
            if (!deepEquals(oldArr[i], newArr[i])) {
                isAppend = false;
                break;
            }
        }
        if (isAppend) {
            operations.push({
                op: "array_push",
                path,
                values: newArr.slice(oldLen),
            });
            return;
        }
    }

    // Index-by-index comparison
    const maxLen = Math.max(oldLen, newLen);
    let changeCount = 0;

    // Count changes first to decide if we should fall back
    for (let i = 0; i < maxLen; i++) {
        if (i >= oldLen || i >= newLen || !deepEquals(oldArr[i], newArr[i])) {
            changeCount++;
        }
    }

    // If more than 50% changed, just replace the whole array
    if (changeCount > maxLen * 0.5) {
        operations.push({ op: "set", path, value: newArr });
        return;
    }

    // Generate individual operations
    for (let i = 0; i < maxLen; i++) {
        const childPath = [...path, i];

        if (i >= oldLen) {
            // New element at end
            operations.push({ op: "set", path: childPath, value: newArr[i] });
        } else if (i >= newLen) {
            // Array truncated - emit splice to remove trailing elements
            operations.push({
                op: "array_splice",
                path,
                index: newLen,
                deleteCount: oldLen - newLen,
            });
            break; // Only need one splice for truncation
        } else if (!deepEquals(oldArr[i], newArr[i])) {
            // Element changed - recursively diff if both are objects
            if (
                typeof oldArr[i] === "object" &&
                oldArr[i] !== null &&
                typeof newArr[i] === "object" &&
                newArr[i] !== null &&
                !Array.isArray(oldArr[i]) &&
                !Array.isArray(newArr[i])
            ) {
                diffValue(oldArr[i], newArr[i], childPath, operations);
            } else {
                operations.push({ op: "set", path: childPath, value: newArr[i] });
            }
        }
    }
}

/**
 * Diff two Maps. Map values are compared with deepEquals but not
 * recursively diffed — if a value changed, the entire new value is sent
 * via map_set. This keeps the operation set simple; recursive map-value
 * diffing can be added later if Map values become large enough to warrant it.
 */
function diffMap(
    oldMap: Map<unknown, unknown>,
    newMap: Map<unknown, unknown>,
    path: PropertyPath,
    operations: DeltaOperation[],
): void {
    // Check for deleted keys
    for (const key of oldMap.keys()) {
        if (!newMap.has(key)) {
            operations.push({
                op: "map_delete",
                path,
                key: key as string | number,
            });
        }
    }

    // Check for added or changed keys
    for (const [key, newValue] of newMap) {
        if (!oldMap.has(key)) {
            // New key
            operations.push({
                op: "map_set",
                path,
                key: key as string | number,
                value: newValue,
            });
        } else {
            const oldValue = oldMap.get(key);
            if (!deepEquals(oldValue, newValue)) {
                // Changed value - for simplicity, just replace the whole value
                // Could recursively diff if needed in the future
                operations.push({
                    op: "map_set",
                    path,
                    key: key as string | number,
                    value: newValue,
                });
            }
        }
    }
}

/**
 * Diff two Sets.
 */
function diffSet(
    oldSet: Set<unknown>,
    newSet: Set<unknown>,
    path: PropertyPath,
    operations: DeltaOperation[],
): void {
    // Check for removed values
    for (const value of oldSet) {
        if (!setHas(newSet, value)) {
            operations.push({ op: "set_delete", path, value });
        }
    }

    // Check for added values
    for (const value of newSet) {
        if (!setHas(oldSet, value)) {
            operations.push({ op: "set_add", path, value });
        }
    }
}

/**
 * Check if a Set contains a value using deep equality. Native Set.has uses
 * reference equality which would miss structuredClone'd objects that are
 * equal by value. This is O(n) per call, making diffSet O(n*m), but
 * component Sets are typically small (tags, flags) so this is acceptable.
 */
function setHas(set: Set<unknown>, value: unknown): boolean {
    for (const item of set) {
        if (deepEquals(item, value)) {
            return true;
        }
    }
    return false;
}

/**
 * Deep equality check for comparing values.
 */
export function deepEquals(a: unknown, b: unknown): boolean {
    if (a === b) {
        return true;
    }

    if (a == null || b == null) {
        return a === b;
    }

    if (typeof a !== typeof b) {
        return false;
    }

    if (typeof a !== "object") {
        return a === b;
    }

    // Handle Map
    if (a instanceof Map && b instanceof Map) {
        if (a.size !== b.size) {
            return false;
        }
        for (const [key, value] of a) {
            if (!b.has(key) || !deepEquals(value, b.get(key))) {
                return false;
            }
        }
        return true;
    }

    // Handle Set
    if (a instanceof Set && b instanceof Set) {
        if (a.size !== b.size) {
            return false;
        }
        for (const value of a) {
            if (!setHas(b, value)) {
                return false;
            }
        }
        return true;
    }

    // Handle Array
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (!deepEquals(a[i], b[i])) {
                return false;
            }
        }
        return true;
    }

    // Handle Object
    if (Array.isArray(a) || Array.isArray(b)) {
        return false;
    }

    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) {
        return false;
    }

    for (const key of aKeys) {
        if (!Object.prototype.hasOwnProperty.call(bObj, key)) {
            return false;
        }
        if (!deepEquals(aObj[key], bObj[key])) {
            return false;
        }
    }

    return true;
}

/**
 * Rough approximation of JSON-serialized byte size. This doesn't need to
 * be exact — it's only used to compare delta size vs full component size
 * to decide which to send. The estimates mirror JSON.stringify output
 * lengths. Maps and Sets include overhead for the {__type, __data} wrapper
 * that the persistence serializer uses on the wire.
 */
export function estimateSize(value: unknown): number {
    if (value == null) {
        return 4; // "null"
    }

    if (typeof value === "boolean") {
        return value ? 4 : 5; // "true" or "false"
    }

    if (typeof value === "number") {
        return String(value).length;
    }

    if (typeof value === "string") {
        return value.length + 2; // quotes
    }

    if (value instanceof Map) {
        let size = 20; // overhead for __type marker
        for (const [k, v] of value) {
            size += estimateSize(k) + estimateSize(v) + 2;
        }
        return size;
    }

    if (value instanceof Set) {
        let size = 20; // overhead for __type marker
        for (const v of value) {
            size += estimateSize(v) + 1;
        }
        return size;
    }

    if (Array.isArray(value)) {
        let size = 2; // []
        for (const item of value) {
            size += estimateSize(item) + 1;
        }
        return size;
    }

    if (typeof value === "object") {
        let size = 2; // {}
        for (const [k, v] of Object.entries(value)) {
            size += k.length + 3 + estimateSize(v) + 1;
        }
        return size;
    }

    return 10; // fallback
}

/**
 * Estimate the wire cost of a delta by summing only the payload values
 * (what's in `value`, `values`, `insert`) plus a fixed overhead per
 * operation for the structural fields (op, path, key, index, etc).
 * The 30-byte overhead is a rough average across operation types —
 * a set op with path ["items", 0] serializes to ~25 bytes of structure,
 * a splice with index+deleteCount is ~35 bytes.
 */
function estimateOperationsSize(operations: DeltaOperation[]): number {
    const perOpOverhead = 30;
    let size = 2; // [] wrapper
    for (const op of operations) {
        size += perOpOverhead;
        switch (op.op) {
            case "set":
                size += estimateSize(op.value);
                break;
            case "array_push":
                size += estimateSize(op.values);
                break;
            case "array_splice":
                if (op.insert) {
                    size += estimateSize(op.insert);
                }
                break;
            case "map_set":
                size += estimateSize(op.value);
                break;
            case "set_add":
                size += estimateSize(op.value);
                break;
        }
    }
    return size;
}

/**
 * Decide whether to send a delta or the full component. A delta is only
 * worth it when the component is large enough that the per-operation
 * overhead is outweighed by not sending unchanged fields. Small components
 * (like DirectionComponent at ~60 bytes) are always cheaper to send whole
 * because the delta message envelope (type, entityId, componentId,
 * operations array) adds overhead that a setComponent message doesn't have.
 *
 * The 128-byte floor and 0.8 ratio are tuned empirically — components
 * below 128 bytes are never worth diffing, and above that we require the
 * delta to be at least 20% smaller to justify the added complexity on
 * the receiving end.
 */
export function isDeltaSmaller(
    operations: DeltaOperation[],
    fullComponent: Components,
): boolean {
    const fullSize = estimateSize(fullComponent);
    if (fullSize < 128) {
        return false;
    }
    const deltaSize = estimateOperationsSize(operations);
    return deltaSize < fullSize * 0.8;
}

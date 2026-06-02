/**
 * Maximum object nesting depth retained when snapshotting log data. Live game
 * objects such as entities form deep trees; capping the depth keeps a stray
 * entity log from inflating a single buffered entry into the whole world.
 */
const maxDepth = 8;

/**
 * Produces a JSON-safe snapshot of an arbitrary log payload.
 *
 * Log data is typed as `unknown`, so callers can pass live game objects such as
 * entities, which hold circular `_parent`/`_children` references. Keeping those
 * references in the rolling log buffer makes the buffer impossible to serialize,
 * which breaks save files that embed the log history. This walks the value
 * eagerly, dropping circular references, flattening Errors/Maps/Sets, and
 * capping depth so the result can always be passed to JSON.stringify. Taking the
 * snapshot at log time also records the value as it was when logged rather than a
 * mutable reference that may change before the buffer is read.
 */
export function snapshotLogData(value: unknown): unknown {
    return snapshot(value, new WeakSet<object>(), 0);
}

function snapshot(
    value: unknown,
    seen: WeakSet<object>,
    depth: number,
): unknown {
    if (value === null || typeof value !== "object") {
        return snapshotPrimitive(value);
    }

    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack,
        };
    }

    // A repeated reference along the current ancestor chain is a true cycle.
    if (seen.has(value)) {
        return "[Circular]";
    }

    if (depth >= maxDepth) {
        return "[MaxDepth]";
    }

    seen.add(value);
    const result = snapshotContainer(value, seen, depth);
    // Releasing the reference once this branch is done lets the same object be
    // fully serialized when it legitimately appears in a sibling branch.
    seen.delete(value);
    return result;
}

function snapshotContainer(
    value: object,
    seen: WeakSet<object>,
    depth: number,
): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => snapshot(item, seen, depth + 1));
    }

    if (value instanceof Set) {
        return Array.from(value, (item) => snapshot(item, seen, depth + 1));
    }

    if (value instanceof Map) {
        const result: Record<string, unknown> = {};
        for (const [key, item] of value.entries()) {
            result[String(key)] = snapshot(item, seen, depth + 1);
        }
        return result;
    }

    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
        const snapshotted = snapshot(item, seen, depth + 1);
        if (snapshotted !== undefined) {
            result[key] = snapshotted;
        }
    }
    return result;
}

function snapshotPrimitive(value: unknown): unknown {
    if (typeof value === "bigint") {
        return value.toString();
    }
    if (typeof value === "function") {
        return undefined;
    }
    return value;
}

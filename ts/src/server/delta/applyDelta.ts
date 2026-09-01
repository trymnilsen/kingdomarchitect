import type { Components } from "../../game/component/component.ts";
import { deepEquals } from "./diffComponent.ts";
import type { DeltaOperation, PropertyPath } from "./deltaTypes.ts";

/**
 * Apply delta operations to a component, mutating it in place. This runs
 * on the client after receiving a ComponentDeltaGameMessage from the server.
 * Operations are applied in order. The server's diffComponents guarantees
 * that applying them sequentially to the old state produces the new state.
 *
 * Mutations are done in-place rather than producing a new object because
 * components are stored by reference in the entity's component array.
 * Creating a new object would require re-registering it with the entity.
 */
export function applyDelta(
    component: Components,
    operations: DeltaOperation[],
): void {
    for (const op of operations) {
        applyOperation(component, op);
    }
}

function applyOperation(component: Components, op: DeltaOperation): void {
    switch (op.op) {
        case "set":
            applySet(component, op.path, op.value);
            break;
        case "delete":
            applyDelete(component, op.path);
            break;
        case "array_push":
            applyArrayPush(component, op.path, op.values);
            break;
        case "array_splice":
            applyArraySplice(
                component,
                op.path,
                op.index,
                op.deleteCount,
                op.insert,
            );
            break;
        case "map_set":
            applyMapSet(component, op.path, op.key, op.value);
            break;
        case "map_delete":
            applyMapDelete(component, op.path, op.key);
            break;
        case "set_add":
            applySetAdd(component, op.path, op.value);
            break;
        case "set_delete":
            applySetDelete(component, op.path, op.value);
            break;
    }
}

/**
 * Walk the path up to (but not including) the last segment, returning
 * the parent container and the final key. This split is needed because
 * mutations like set/delete operate on the parent: parent[key] = value.
 * If we navigated all the way to the leaf, we'd have the value but no
 * way to mutate it in its parent container.
 */
function navigateToParent(
    component: Components,
    path: PropertyPath,
): [unknown, string | number | undefined] {
    if (path.length === 0) {
        return [component, undefined];
    }

    let current: unknown = component;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (current instanceof Map) {
            current = current.get(key);
        } else if (Array.isArray(current)) {
            current = current[key as number];
        } else if (typeof current === "object" && current !== null) {
            current = (current as Record<string, unknown>)[key as string];
        } else {
            throw new Error(
                `Cannot navigate path ${path.join(".")} - got non-object at index ${i}`,
            );
        }
    }

    return [current, path[path.length - 1]];
}

function navigateToTarget(component: Components, path: PropertyPath): unknown {
    let current: unknown = component;
    for (const key of path) {
        if (current instanceof Map) {
            current = current.get(key);
        } else if (Array.isArray(current)) {
            current = current[key as number];
        } else if (typeof current === "object" && current !== null) {
            current = (current as Record<string, unknown>)[key as string];
        } else {
            throw new Error(
                `Cannot navigate path ${path.join(".")} - got non-object`,
            );
        }
    }
    return current;
}

function applySet(
    component: Components,
    path: PropertyPath,
    value: unknown,
): void {
    if (path.length === 0) {
        // Replace entire component - this shouldn't happen in practice
        // since we'd send a SetComponentGameMessage instead
        Object.assign(component, value);
        return;
    }

    const [parent, key] = navigateToParent(component, path);
    if (key === undefined) {
        return;
    }

    if (parent instanceof Map) {
        parent.set(key, value);
    } else if (Array.isArray(parent)) {
        parent[key as number] = value;
    } else if (typeof parent === "object" && parent !== null) {
        (parent as Record<string, unknown>)[key as string] = value;
    }
}

function applyDelete(component: Components, path: PropertyPath): void {
    if (path.length === 0) {
        return; // Can't delete the root
    }

    const [parent, key] = navigateToParent(component, path);
    if (key === undefined) {
        return;
    }

    if (parent instanceof Map) {
        parent.delete(key);
    } else if (Array.isArray(parent)) {
        // For arrays, deleting an index is unusual - use splice instead
        delete parent[key as number];
    } else if (typeof parent === "object" && parent !== null) {
        delete (parent as Record<string, unknown>)[key as string];
    }
}

function applyArrayPush(
    component: Components,
    path: PropertyPath,
    values: unknown[],
): void {
    const target = navigateToTarget(component, path);
    if (!Array.isArray(target)) {
        throw new Error(`Expected array at path ${path.join(".")}`);
    }
    target.push(...values);
}

function applyArraySplice(
    component: Components,
    path: PropertyPath,
    index: number,
    deleteCount: number,
    insert?: unknown[],
): void {
    const target = navigateToTarget(component, path);
    if (!Array.isArray(target)) {
        throw new Error(`Expected array at path ${path.join(".")}`);
    }
    if (insert) {
        target.splice(index, deleteCount, ...insert);
    } else {
        target.splice(index, deleteCount);
    }
}

function applyMapSet(
    component: Components,
    path: PropertyPath,
    key: string | number,
    value: unknown,
): void {
    const target = navigateToTarget(component, path);
    if (!(target instanceof Map)) {
        throw new Error(`Expected Map at path ${path.join(".")}`);
    }
    target.set(key, value);
}

function applyMapDelete(
    component: Components,
    path: PropertyPath,
    key: string | number,
): void {
    const target = navigateToTarget(component, path);
    if (!(target instanceof Map)) {
        throw new Error(`Expected Map at path ${path.join(".")}`);
    }
    target.delete(key);
}

function applySetAdd(
    component: Components,
    path: PropertyPath,
    value: unknown,
): void {
    const target = navigateToTarget(component, path);
    if (!(target instanceof Set)) {
        throw new Error(`Expected Set at path ${path.join(".")}`);
    }
    target.add(value);
}

function applySetDelete(
    component: Components,
    path: PropertyPath,
    value: unknown,
): void {
    const target = navigateToTarget(component, path);
    if (!(target instanceof Set)) {
        throw new Error(`Expected Set at path ${path.join(".")}`);
    }
    // diffSet detects removals with deep equality, so the member we are told to
    // delete is a structural copy and never the same reference as the one held
    // by this Set. Native Set.delete would silently do nothing.
    for (const member of target) {
        if (deepEquals(member, value)) {
            target.delete(member);
            return;
        }
    }
}

import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { visitChildren } from "../../../src/game/entity/child/visit.ts";
import { firstChildWhere } from "../../../src/game/entity/child/first.ts";
import { entityWithId } from "../../../src/game/entity/child/withId.ts";

/**
 * Builds the reference fixture tree used across the ordering tests:
 *
 *            root
 *          /  |   \
 *         a   b    c
 *        / \   \
 *       a1  a2  b1
 *
 * Breadth-first visit order is therefore:
 *   root, a, b, c, a1, a2, b1
 *
 * Positions are set off-origin so any accidental coordinate dependence in
 * traversal would surface rather than be masked by zeros.
 */
function buildFixture(): Map<string, Entity> {
    const ids = ["root", "a", "b", "c", "a1", "a2", "b1"];
    const nodes = new Map<string, Entity>();
    let i = 0;
    for (const id of ids) {
        const entity = new Entity(id);
        entity.position = { x: 12 + i, y: 8 + i * 2 };
        nodes.set(id, entity);
        i++;
    }

    nodes.get("root")!.addChild(nodes.get("a")!);
    nodes.get("root")!.addChild(nodes.get("b")!);
    nodes.get("root")!.addChild(nodes.get("c")!);
    nodes.get("a")!.addChild(nodes.get("a1")!);
    nodes.get("a")!.addChild(nodes.get("a2")!);
    nodes.get("b")!.addChild(nodes.get("b1")!);

    return nodes;
}

const bfsOrder = ["root", "a", "b", "c", "a1", "a2", "b1"];
const depthById: Record<string, number> = {
    root: 0,
    a: 1,
    b: 1,
    c: 1,
    a1: 2,
    a2: 2,
    b1: 2,
};

function visitOrder(
    root: Entity,
    stop: (entity: Entity) => boolean = () => false,
): string[] {
    const visited: string[] = [];
    visitChildren(root, (entity) => {
        visited.push(entity.id);
        return stop(entity);
    });
    return visited;
}

describe("visitChildren", () => {
    it("visits breadth-first: every depth-N node before any depth-(N+1) node", () => {
        const nodes = buildFixture();
        const visited = visitOrder(nodes.get("root")!);

        assert.deepStrictEqual(visited, bfsOrder);

        // Depth must be non-decreasing across the visit order. This is the
        // invariant firstChildWhere / entityWithId rely on. A silent switch to
        // DFS would break "first match" semantics without changing the set.
        let previousDepth = -1;
        for (const id of visited) {
            const depth = depthById[id];
            assert.ok(
                depth >= previousDepth,
                `depth went backwards at ${id} (${depth} after ${previousDepth})`,
            );
            previousDepth = depth;
        }
    });

    it("firstChildWhere returns the breadth-first first match", () => {
        const nodes = buildFixture();
        // Both depth-1 "a" and depth-2 "a1"/"a2" have ids starting with "a".
        // The first match in BFS order is "a", not a deeper descendant.
        const match = firstChildWhere(nodes.get("root")!, (entity) =>
            entity.id.startsWith("a"),
        );

        assert.strictEqual(match?.id, "a");
    });

    it("entityWithId finds nodes at every depth and returns null when absent", () => {
        const nodes = buildFixture();
        const root = nodes.get("root")!;

        for (const id of bfsOrder) {
            assert.strictEqual(entityWithId(root, id)?.id, id);
        }
        assert.strictEqual(entityWithId(root, "missing"), null);
    });
});

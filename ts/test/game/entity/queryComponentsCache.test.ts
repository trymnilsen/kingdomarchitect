import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { visitChildren } from "../../../src/game/entity/child/visit.ts";
import {
    HealthComponentId,
    createHealthComponent,
} from "../../../src/game/component/healthComponent.ts";
import {
    ImmortalComponentId,
    createImmortalComponent,
} from "../../../src/game/component/immortalComponent.ts";

/**
 * Reference implementation: a fresh, uncached breadth-first walk. Every cache
 * test asserts the cached `queryComponents` matches this on the same tree, so a
 * stale cache surfaces as a mismatch rather than a silent wrong answer.
 */
function bruteForceQuery(root: Entity, componentId: string): Map<Entity, unknown> {
    const result = new Map<Entity, unknown>();
    visitChildren(root, (entity) => {
        const component = entity.getEcsComponent(componentId as never);
        if (component) {
            result.set(entity, component);
        }
        return false;
    });
    return result;
}

function assertMatchesBruteForce(root: Entity, componentId: string) {
    const cached = root.queryComponents(componentId as never);
    const brute = bruteForceQuery(root, componentId);
    assert.strictEqual(
        cached.size,
        brute.size,
        `size mismatch for ${componentId}`,
    );
    for (const [entity, component] of brute) {
        assert.strictEqual(
            cached.get(entity),
            component,
            `entry mismatch for ${entity.id}`,
        );
    }
}

/**
 * root(12,8) ── a(13,10) ── a1(15,14)
 *            └─ b(14,12)
 * Health is placed on a1 and b; immortal on a. Off-origin positions per the
 * project's testing convention.
 */
function buildTree() {
    const root = new Entity("root");
    const a = new Entity("a");
    const b = new Entity("b");
    const a1 = new Entity("a1");
    root.position = { x: 12, y: 8 };
    a.position = { x: 13, y: 10 };
    b.position = { x: 14, y: 12 };
    a1.position = { x: 15, y: 14 };

    root.addChild(a);
    root.addChild(b);
    a.addChild(a1);

    a1.setEcsComponent(createHealthComponent(10, 10));
    b.setEcsComponent(createHealthComponent(5, 8));
    a.setEcsComponent(createImmortalComponent());

    return { root, a, b, a1 };
}

describe("queryComponents cache", () => {
    it("returns the same map reference on repeated identical queries (no rebuild)", () => {
        const { root } = buildTree();

        const first = root.queryComponents(HealthComponentId);
        const second = root.queryComponents(HealthComponentId);

        assert.strictEqual(first, second);
        assert.strictEqual(first.size, 2);
    });

    it("invalidates when a component is added to an in-tree entity", () => {
        const { root, a } = buildTree();

        // Prime the cache, then add Health to `a` (which had none).
        root.queryComponents(HealthComponentId);
        a.setEcsComponent(createHealthComponent(3, 3));

        assertMatchesBruteForce(root, HealthComponentId);
        assert.strictEqual(root.queryComponents(HealthComponentId).size, 3);
    });

    it("invalidates when a component is removed from an in-tree entity", () => {
        const { root, b } = buildTree();

        root.queryComponents(HealthComponentId);
        b.removeEcsComponent(HealthComponentId);

        assertMatchesBruteForce(root, HealthComponentId);
        assert.strictEqual(root.queryComponents(HealthComponentId).size, 1);
    });

    it("invalidates when a child subtree is added", () => {
        const { root } = buildTree();
        root.queryComponents(HealthComponentId);

        const c = new Entity("c");
        c.position = { x: 20, y: 20 };
        const c1 = new Entity("c1");
        c1.position = { x: 21, y: 21 };
        c1.setEcsComponent(createHealthComponent(7, 7));
        c.addChild(c1);
        root.addChild(c);

        assertMatchesBruteForce(root, HealthComponentId);
        assert.strictEqual(root.queryComponents(HealthComponentId).size, 3);
    });

    it("invalidates when a child subtree is removed", () => {
        const { root, a } = buildTree();
        root.queryComponents(HealthComponentId);

        // Removing `a` takes its descendant a1 (which carries Health) with it.
        root.removeChild(a);

        assertMatchesBruteForce(root, HealthComponentId);
        assert.strictEqual(root.queryComponents(HealthComponentId).size, 1);
    });

    it("a setEcsComponent replace yields the new reference, not the stale one", () => {
        const { root, b } = buildTree();
        root.queryComponents(HealthComponentId);

        const replacement = createHealthComponent(1, 1);
        b.setEcsComponent(replacement);

        assert.strictEqual(
            root.queryComponents(HealthComponentId).get(b),
            replacement,
        );
    });

    it("keeps per-id entries isolated: adding one id does not drop another's cached map", () => {
        const { root, b } = buildTree();

        const healthBefore = root.queryComponents(HealthComponentId);
        const immortalBefore = root.queryComponents(ImmortalComponentId);

        // component_added upserts only the immortal cache (in place — same map
        // reference, now with the new member) and leaves the unrelated health
        // map entirely untouched.
        b.setEcsComponent(createImmortalComponent());

        assert.strictEqual(
            root.queryComponents(HealthComponentId),
            healthBefore,
            "unrelated health cache should not be rebuilt",
        );
        assert.strictEqual(
            root.queryComponents(ImmortalComponentId),
            immortalBefore,
            "immortal map is upserted in place, not rebuilt",
        );
        assert.strictEqual(root.queryComponents(ImmortalComponentId).size, 2);
        assert.ok(root.queryComponents(ImmortalComponentId).has(b));
    });

    it("survives an in-place updateComponent: same map, mutated value", () => {
        const { root, b } = buildTree();

        const before = root.queryComponents(HealthComponentId);
        const componentRef = before.get(b);

        b.updateComponent(HealthComponentId, (health) => {
            health.currentHp = 1;
        });

        const after = root.queryComponents(HealthComponentId);
        // updateComponent mutates in place and emits component_updated, which
        // must NOT rebuild the cache (this is the per-tick thrash guard).
        assert.strictEqual(after, before, "cache map must not be rebuilt");
        assert.strictEqual(
            after.get(b),
            componentRef,
            "same component reference, mutated in place",
        );
        assert.strictEqual(after.get(b)?.currentHp, 1);
    });

    it("survives a transform (move): same map reference", () => {
        const { root, b } = buildTree();

        const before = root.queryComponents(HealthComponentId);
        b.position = { x: 99, y: 99 };
        const after = root.queryComponents(HealthComponentId);

        assert.strictEqual(after, before);
    });
});

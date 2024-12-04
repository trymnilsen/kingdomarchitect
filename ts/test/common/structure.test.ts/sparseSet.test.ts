import { test } from "node:test";
import assert from "node:assert";
import { SparseSet } from "../../../src/common/structure/sparseSet.js";

interface MyEntity {
    id: number;
    name: string;
}

test("SparseSet: Add and check size", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };

    sparseSet.add(entity1);

    assert.strictEqual(
        sparseSet.size,
        1,
        "Size should be 1 after adding an item",
    );
});

test("SparseSet: Add and contains", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };
    const entity2 = { id: 2, name: "Bob" };

    sparseSet.add(entity1);
    sparseSet.add(entity2);

    assert.ok(sparseSet.contains(entity1), "Should contain entity1");
    assert.ok(sparseSet.contains(entity2), "Should contain entity2");
});

test("SparseSet: Delete item and verify size and contains", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };
    const entity2 = { id: 2, name: "Bob" };

    sparseSet.add(entity1);
    sparseSet.add(entity2);

    sparseSet.delete(entity1);

    assert.strictEqual(
        sparseSet.size,
        1,
        "Size should be 1 after deleting an item",
    );
    assert.ok(!sparseSet.contains(entity1), "Should no longer contain entity1");
    assert.ok(sparseSet.contains(entity2), "Should still contain entity2");
});

test("SparseSet: Element order and deletion consistency", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };
    const entity2 = { id: 2, name: "Bob" };
    const entity3 = { id: 3, name: "Charlie" };

    sparseSet.add(entity1);
    sparseSet.add(entity2);
    sparseSet.add(entity3);

    sparseSet.delete(entity2);

    assert.strictEqual(
        sparseSet.size,
        2,
        "Size should be 2 after deleting one item",
    );
    assert.strictEqual(
        sparseSet.elementAt(0),
        entity1,
        "First element should be entity1",
    );
    assert.strictEqual(
        sparseSet.elementAt(1),
        entity3,
        "Second element should be entity3",
    );
});

test("SparseSet: Prevent duplicates", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };

    sparseSet.add(entity1);
    sparseSet.add(entity1); // Try adding the same item again

    assert.strictEqual(
        sparseSet.size,
        1,
        "Size should remain 1 after attempting to add a duplicate",
    );
});

test("SparseSet: Out of bounds access", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };

    sparseSet.add(entity1);

    assert.throws(
        () => sparseSet.elementAt(-1),
        /Index out of bounds/,
        "Negative index should throw an error",
    );
    assert.throws(
        () => sparseSet.elementAt(1),
        /Index out of bounds/,
        "Index out of range should throw an error",
    );
});

test("SparseSet: elementAt() works correctly after interleaved operations", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };
    const entity2 = { id: 2, name: "Bob" };
    const entity3 = { id: 3, name: "Charlie" };

    sparseSet.add(entity1);
    sparseSet.add(entity2);
    sparseSet.delete(entity1);
    sparseSet.add(entity3);

    assert.strictEqual(
        sparseSet.elementAt(0),
        entity3,
        "First element should be entity3",
    );
    assert.strictEqual(
        sparseSet.elementAt(1),
        entity2,
        "Second element should be entity2",
    );
});

test("SparseSet: delete() maintains sparse-dense consistency", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };
    const entity2 = { id: 2, name: "Bob" };
    const entity3 = { id: 3, name: "Charlie" };

    sparseSet.add(entity1);
    sparseSet.add(entity2);
    sparseSet.add(entity3);

    sparseSet.delete(entity2);

    // Check sparse-dense consistency
    assert.strictEqual(
        sparseSet.contains(entity1),
        true,
        "Sparse set should still contain entity1",
    );
    assert.strictEqual(
        sparseSet.contains(entity3),
        true,
        "Sparse set should still contain entity3",
    );
    assert.strictEqual(
        sparseSet.contains(entity2),
        false,
        "Sparse set should no longer contain entity2",
    );
});

test("SparseSet: delete() handles repeated deletions gracefully", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };

    sparseSet.add(entity1);

    sparseSet.delete(entity1);
    sparseSet.delete(entity1); // Deleting again should not cause errors

    assert.strictEqual(
        sparseSet.size,
        0,
        "Size should remain 0 after repeated deletions",
    );
    assert.strictEqual(
        sparseSet.contains(entity1),
        false,
        "Entity1 should not be contained after deletion",
    );
});

test("SparseSet: handles re-adding after deletion correctly", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };

    sparseSet.add(entity1);
    sparseSet.delete(entity1);
    sparseSet.add(entity1); // Re-add the same item

    assert.strictEqual(
        sparseSet.size,
        1,
        "Size should be 1 after re-adding an item",
    );
    assert.ok(
        sparseSet.contains(entity1),
        "Entity1 should be contained after re-adding",
    );
});

test("SparseSet: add handles empty and complex objects", () => {
    const sparseSet = new SparseSet<Record<string, unknown>>((item) =>
        JSON.stringify(item),
    );

    const entity1 = {};
    const entity2 = { nested: { value: 42 } };

    sparseSet.add(entity1);
    sparseSet.add(entity2);

    assert.strictEqual(
        sparseSet.size,
        2,
        "Size should be 2 after adding complex objects",
    );
    assert.ok(sparseSet.contains(entity1), "Should contain empty object");
    assert.ok(sparseSet.contains(entity2), "Should contain nested object");
});

test("SparseSet: edge case of deleting last element", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };
    const entity2 = { id: 2, name: "Bob" };

    sparseSet.add(entity1);
    sparseSet.add(entity2);

    sparseSet.delete(entity2);

    assert.strictEqual(
        sparseSet.size,
        1,
        "Size should be 1 after deleting last element",
    );
    assert.ok(sparseSet.contains(entity1), "Should still contain entity1");
    assert.ok(!sparseSet.contains(entity2), "Should no longer contain entity2");
});

test("SparseSet: delete all and re-add works correctly", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };
    const entity2 = { id: 2, name: "Bob" };

    sparseSet.add(entity1);
    sparseSet.add(entity2);

    sparseSet.delete(entity1);
    sparseSet.delete(entity2);

    assert.strictEqual(
        sparseSet.size,
        0,
        "Size should be 0 after deleting all elements",
    );

    sparseSet.add(entity1);
    sparseSet.add(entity2);

    assert.strictEqual(
        sparseSet.size,
        2,
        "Size should be 2 after re-adding elements",
    );
    assert.ok(
        sparseSet.contains(entity1),
        "Should contain entity1 after re-adding",
    );
    assert.ok(
        sparseSet.contains(entity2),
        "Should contain entity2 after re-adding",
    );
});

test("SparseSet: elements maintain proper order during swaps", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };
    const entity2 = { id: 2, name: "Bob" };
    const entity3 = { id: 3, name: "Charlie" };

    sparseSet.add(entity1);
    sparseSet.add(entity2);
    sparseSet.add(entity3);

    sparseSet.delete(entity1);

    assert.strictEqual(
        sparseSet.elementAt(0),
        entity3,
        "After deletion, entity3 should occupy position 0",
    );
    assert.strictEqual(
        sparseSet.elementAt(1),
        entity2,
        "After deletion, entity2 should occupy position 1",
    );
});

test("SparseSet: adding the same object twice maintains consistency", () => {
    const sparseSet = new SparseSet<MyEntity>((item) => item.id.toString());
    const entity1 = { id: 1, name: "Alice" };

    sparseSet.add(entity1);
    sparseSet.add(entity1); // Adding the same object again should do nothing

    assert.strictEqual(
        sparseSet.size,
        1,
        "Size should remain 1 after trying to add a duplicate",
    );
    assert.ok(
        sparseSet.contains(entity1),
        "SparseSet should still contain the item",
    );
});

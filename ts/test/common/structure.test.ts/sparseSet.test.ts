import { it, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";
import { SparseSet } from "../../../src/common/structure/sparseSet.js";

interface Entry {
    id: number;
    value?: string;
}

describe("Sparse set", () => {
    let sparseSet: SparseSet<Entry>;
    beforeEach(() => {
        sparseSet = new SparseSet<Entry>();
    });

    describe("Init", () => {
        it("SparseSet initializes correctly", () => {
            assert.strictEqual(
                sparseSet.size,
                0,
                "Size should be 0 on initialization",
            );
            assert.deepStrictEqual(
                [...sparseSet.sparse.keys()],
                [],
                "Sparse map should be empty",
            );
            assert.deepStrictEqual(
                sparseSet.dense,
                [],
                "Dense array should be empty",
            );
        });
    });

    describe("Add", () => {
        it("add() inserts elements correctly", () => {
            sparseSet.add({ id: 1 });
            sparseSet.add({ id: 2 });

            assert.strictEqual(
                sparseSet.size,
                2,
                "Size should reflect the number of elements",
            );
            assert.deepStrictEqual(
                sparseSet.elementAt(0),
                { id: 1 },
                "First element should match",
            );
            assert.deepStrictEqual(
                sparseSet.elementAt(1),
                { id: 2 },
                "Second element should match",
            );
        });

        it("add() ignores duplicate keys", () => {
            const sameObject = { id: 1 };
            sparseSet.add(sameObject);
            sparseSet.add(sameObject);

            assert.strictEqual(
                sparseSet.size,
                1,
                "Size should not increase for duplicate keys",
            );
        });

        it("add() handles large numbers of elements efficiently", () => {
            const items: Entry[] = [];
            for (let i = 1; i <= 1000; i++) {
                items.push({ id: i });
            }

            for (let i = 1; i <= 1000; i++) {
                sparseSet.add(items[i]);
            }

            assert.strictEqual(
                sparseSet.size,
                1000,
                "Size should reflect all added elements",
            );

            for (let i = 1; i <= 1000; i++) {
                assert.strictEqual(
                    sparseSet.contains(items[i]),
                    true,
                    `Should contain key ${i}`,
                );
            }
        });
    });

    describe("access", () => {
        it("contains() checks existence of elements correctly", () => {
            const entry = { id: 1 };

            sparseSet.add(entry);

            assert.strictEqual(
                sparseSet.contains(entry),
                true,
                "Should contain the added element",
            );
            assert.strictEqual(
                sparseSet.contains({ id: 2 }),
                false,
                "Should not contain an unadded element",
            );
        });

        it("elementAt() retrieves elements by index", () => {
            sparseSet.add({ id: 1 });
            sparseSet.add({ id: 2 });

            assert.deepStrictEqual(
                sparseSet.elementAt(0),
                { id: 1 },
                "Should return correct element at index 0",
            );
            assert.deepStrictEqual(
                sparseSet.elementAt(1),
                { id: 2 },
                "Should return correct element at index 1",
            );
        });

        it("elementAt() works correctly after interleaved operations", () => {
            const toDelete = { id: 2 };
            sparseSet.add({ id: 1 });
            sparseSet.add(toDelete);
            sparseSet.add({ id: 3 });
            sparseSet.delete(toDelete);
            sparseSet.add({ id: 4 });

            assert.strictEqual(
                sparseSet.size,
                3,
                "Size should reflect current elements",
            );
            assert.deepStrictEqual(
                sparseSet.elementAt(0),
                { id: 1 },
                "First element should be correct",
            );
            assert.deepStrictEqual(
                sparseSet.elementAt(1),
                { id: 3 },
                "Second element should be correct",
            );
            assert.deepStrictEqual(
                sparseSet.elementAt(2),
                { id: 4 },
                "Third element should be correct",
            );
        });

        it("elementAt() throws for out-of-bounds indices", () => {
            sparseSet.add({ id: 1 });

            assert.throws(
                () => sparseSet.elementAt(-1),
                "Should throw for negative index",
            );
            assert.throws(
                () => sparseSet.elementAt(1),
                "Should throw for index out of bounds",
            );
        });

        it("contains() returns false for invalid sparse map entries", () => {
            sparseSet.add({ id: 1 });
            sparseSet.sparse.set({ id: 4 }, 0); // Manually corrupt the sparse map

            assert.strictEqual(
                sparseSet.contains({ id: 4 }),
                false,
                "Should not find keys with invalid sparse map entries",
            );
        });
    });

    describe("delete", () => {
        it("delete() removes elements correctly", () => {
            const toRemove = { id: 1 };
            const toKeep = { id: 2 };
            sparseSet.add(toRemove);
            sparseSet.add(toKeep);
            sparseSet.delete(toRemove);

            assert.strictEqual(
                sparseSet.size,
                1,
                "Size should decrease after deletion",
            );
            assert.strictEqual(
                sparseSet.contains(toRemove),
                false,
                "Deleted element should not exist",
            );
            assert.strictEqual(
                sparseSet.contains(toKeep),
                true,
                "Other elements should remain intact",
            );
        });

        it("delete() handles non-existent keys gracefully", () => {
            const toAdd = { id: 1 };
            sparseSet.add(toAdd);
            sparseSet.delete({ id: 5 }); // Attempting to delete a non-existent key

            assert.strictEqual(
                sparseSet.size,
                1,
                "Size should remain unchanged",
            );
            assert.strictEqual(
                sparseSet.contains(toAdd),
                true,
                "Existing elements should remain intact",
            );
        });
        /*
        it("delete() maintains sparse-dense consistency", () => {
            sparseSet.add(1, { id: 1 });
            sparseSet.add(2, { id: 2 });
            sparseSet.add(3, { id: 3 });

            sparseSet.delete(2);

            assert.strictEqual(
                sparseSet.size,
                2,
                "Size should decrease correctly",
            );
            assert.strictEqual(
                sparseSet.contains(2),
                false,
                "Deleted element should not exist",
            );
            assert.strictEqual(
                sparseSet.contains(3),
                true,
                "Last element should have been moved",
            );
            assert.deepStrictEqual(
                sparseSet.elementAt(1),
                { id: 3 },
                "Last element should now be at index of deleted element",
            );
        });

        it("SparseSet handles edge cases for empty sets", () => {
            assert.strictEqual(
                sparseSet.size,
                0,
                "Size should be 0 for an empty set",
            );
            assert.strictEqual(
                sparseSet.contains(1),
                false,
                "Empty set should not contain any elements",
            );
            sparseSet.delete(1); // Deleting a non-existent element
            assert.strictEqual(
                sparseSet.size,
                0,
                "Size should remain 0 after deleting a non-existent element",
            );
        });

        it("delete() handles repeated deletions gracefully", () => {
            sparseSet.add(1, { id: 1 });
            sparseSet.delete(1);
            sparseSet.delete(1); // Attempt to delete the same key again

            assert.strictEqual(
                sparseSet.size,
                0,
                "Size should remain 0 after repeated deletions",
            );
            assert.strictEqual(
                sparseSet.contains(1),
                false,
                "Key should not exist after deletion",
            );
        });

        it("delete() works correctly for large sets", () => {
            for (let i = 1; i <= 1000; i++) {
                sparseSet.add(i, { id: i });
            }

            for (let i = 1; i <= 500; i++) {
                sparseSet.delete(i);
            }

            assert.strictEqual(
                sparseSet.size,
                500,
                "Size should reflect remaining elements",
            );

            for (let i = 1; i <= 500; i++) {
                assert.strictEqual(
                    sparseSet.contains(i),
                    false,
                    `Should not contain deleted key ${i}`,
                );
            }

            for (let i = 501; i <= 1000; i++) {
                assert.strictEqual(
                    sparseSet.contains(i),
                    true,
                    `Should still contain key ${i}`,
                );
            }
        });

        it("SparseSet handles deletion of the last element", () => {
            sparseSet.add(1, { id: 1 });
            sparseSet.add(2, { id: 2 });
            sparseSet.add(3, { id: 3 });
            sparseSet.delete(3);

            assert.strictEqual(
                sparseSet.size,
                2,
                "Size should decrease after deleting the last element",
            );
            assert.strictEqual(
                sparseSet.contains(3),
                false,
                "Deleted element should not exist",
            );
            assert.strictEqual(
                sparseSet.contains(1),
                true,
                "Other elements should remain intact",
            );
            assert.strictEqual(
                sparseSet.contains(2),
                true,
                "Other elements should remain intact",
            );
        });

        it("delete() does nothing for nonexistent keys", () => {
            sparseSet.add(1, { id: 1 });
            sparseSet.delete(2); // Attempt to delete a key that was never added

            assert.strictEqual(
                sparseSet.size,
                1,
                "Size should remain unchanged",
            );
            assert.strictEqual(
                sparseSet.contains(1),
                true,
                "Existing keys should remain intact",
            );
        });*/
    });

    describe("mixed operations", () => {
        /*
        it("SparseSet handles consecutive adds and deletes", () => {
            sparseSet.add(1, { id: 1 });
            sparseSet.add(2, { id: 2 });
            sparseSet.add(3, { id: 3 });

            sparseSet.delete(2);
            sparseSet.add(2, { id: 2 }); // Re-add the deleted key

            assert.strictEqual(
                sparseSet.size,
                3,
                "Size should remain correct after consecutive operations",
            );
            assert.strictEqual(
                sparseSet.contains(1),
                true,
                "Should still contain key 1",
            );
            assert.strictEqual(
                sparseSet.contains(2),
                true,
                "Should contain re-added key 2",
            );
            assert.strictEqual(
                sparseSet.contains(3),
                true,
                "Should still contain key 3",
            );
        });

        it("SparseSet handles re-adding after deletion correctly", () => {
            sparseSet.add(1, { id: 1 });
            sparseSet.delete(1);
            sparseSet.add(1, { id: 1 });

            assert.strictEqual(
                sparseSet.size,
                1,
                "Size should reflect the re-added element",
            );
            assert.strictEqual(
                sparseSet.contains(1),
                true,
                "Should contain re-added key",
            );
        });

        it("SparseSet maintains integrity after clearing and re-adding", () => {
            sparseSet.add(1, { id: 1 });
            sparseSet.add(2, { id: 2 });
            sparseSet.delete(1);
            sparseSet.delete(2);

            assert.strictEqual(
                sparseSet.size,
                0,
                "Size should be 0 after clearing the set",
            );

            sparseSet.add(3, { id: 3 });
            sparseSet.add(4, { id: 4 });

            assert.strictEqual(
                sparseSet.size,
                2,
                "Size should reflect re-added elements",
            );
            assert.strictEqual(
                sparseSet.contains(3),
                true,
                "Should contain re-added key 3",
            );
            assert.strictEqual(
                sparseSet.contains(4),
                true,
                "Should contain re-added key 4",
            );
        });

        it("SparseSet does not corrupt internal state when keys conflict", () => {
            sparseSet.add(1, { id: 1 });
            sparseSet.add(1, { id: 1 }); // Attempting to add a duplicate key

            assert.strictEqual(
                sparseSet.size,
                1,
                "Size should not increase for duplicate keys",
            );
            assert.strictEqual(
                sparseSet.contains(1),
                true,
                "Should still contain the original key",
            );
        });

        it("SparseSet allows reuse after clearing all elements", () => {
            sparseSet.add(1, { id: 1 });
            sparseSet.add(2, { id: 2 });
            sparseSet.delete(1);
            sparseSet.delete(2);

            sparseSet.add(3, { id: 3 });

            assert.strictEqual(
                sparseSet.size,
                1,
                "Size should reflect new addition after clearing",
            );
            assert.strictEqual(
                sparseSet.contains(1),
                false,
                "Old keys should not exist",
            );
            assert.strictEqual(
                sparseSet.contains(2),
                false,
                "Old keys should not exist",
            );
            assert.strictEqual(
                sparseSet.contains(3),
                true,
                "New key should exist",
            );
        });

        it("SparseSet handles repeated additions and deletions of the same key", () => {
            sparseSet.add(1, { id: 1 });
            sparseSet.delete(1);
            sparseSet.add(1, { id: 1 });

            assert.strictEqual(
                sparseSet.size,
                1,
                "Size should reflect latest addition",
            );
            assert.strictEqual(
                sparseSet.contains(1),
                true,
                "Should contain the re-added key",
            );
        });

        it("Order in dense array remains valid after multiple operations", () => {
            sparseSet.add(1, { id: 1 });
            sparseSet.add(2, { id: 2 });
            sparseSet.add(3, { id: 3 });
            sparseSet.delete(2);

            assert.deepStrictEqual(
                sparseSet.elementAt(0),
                { id: 1 },
                "First element should remain unchanged",
            );
            assert.deepStrictEqual(
                sparseSet.elementAt(1),
                { id: 3 },
                "Last element should replace the deleted one",
            );
        });*/
    });
});

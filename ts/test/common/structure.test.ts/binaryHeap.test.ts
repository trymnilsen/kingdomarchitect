import { it, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";
import { BinaryHeap } from "../../../src/common/structure/binaryHeap.js";

// Scoring functions for testing
const simpleScore = (x: number) => x;
const negativeScore = (x: number) => -x; // Inverted scoring: max-heap behavior
const stringLengthScore = (str: string) => str.length; // Based on string length

describe("BinaryHeap", () => {
    describe("Initialization", () => {
        it("should initialize an empty heap", () => {
            const heap = new BinaryHeap<number>(simpleScore);
            assert.strictEqual(
                heap.size,
                0,
                "Heap size should be 0 after initialization",
            );
        });

        it("should initialize with a scoring function", () => {
            const heap = new BinaryHeap<number>(simpleScore);
            assert.strictEqual(
                typeof heap["scoreFunction"],
                "function",
                "Heap should have a valid score function",
            );
        });
    });

    describe("Basic operations", () => {
        it("should push elements and maintain size", () => {
            const heap = new BinaryHeap<number>(simpleScore);
            heap.push(10);
            assert.strictEqual(
                heap.size,
                1,
                "Heap size should increase after push",
            );
            heap.push(5);
            assert.strictEqual(
                heap.size,
                2,
                "Heap size should reflect all pushed elements",
            );
        });

        it("should pop elements in sorted order", () => {
            const heap = new BinaryHeap<number>(simpleScore);
            heap.push(10);
            heap.push(5);
            heap.push(20);
            const first = heap.pop();
            const second = heap.pop();
            const third = heap.pop();
            assert.strictEqual(
                first,
                5,
                "First popped element should be the smallest",
            );
            assert.strictEqual(
                second,
                10,
                "Second popped element should be the next smallest",
            );
            assert.strictEqual(
                third,
                20,
                "Last popped element should be the largest",
            );
            assert.strictEqual(
                heap.size,
                0,
                "Heap size should be 0 after popping all elements",
            );
        });
    });

    describe("Simple Scoring", () => {
        it("should correctly order elements (min-heap)", () => {
            const heap = new BinaryHeap<number>(simpleScore);
            heap.push(15);
            heap.push(10);
            heap.push(20);
            assert.strictEqual(
                heap.pop(),
                10,
                "Pop should return the smallest element first",
            );
            assert.strictEqual(
                heap.pop(),
                15,
                "Pop should return the next smallest element",
            );
            assert.strictEqual(
                heap.pop(),
                20,
                "Pop should return the largest element last",
            );
        });

        it("should handle duplicate values", () => {
            const heap = new BinaryHeap<number>(simpleScore);
            heap.push(10);
            heap.push(10);
            heap.push(5);
            assert.strictEqual(
                heap.pop(),
                5,
                "First pop should return the smallest element",
            );
            assert.strictEqual(
                heap.pop(),
                10,
                "Second pop should return a duplicate",
            );
            assert.strictEqual(
                heap.pop(),
                10,
                "Third pop should return the remaining duplicate",
            );
        });
    });

    describe("Negative Scoring (Max-Heap)", () => {
        it("should correctly order elements (max-heap)", () => {
            const heap = new BinaryHeap<number>(negativeScore);
            heap.push(15);
            heap.push(10);
            heap.push(20);
            assert.strictEqual(
                heap.pop(),
                20,
                "Pop should return the largest element first",
            );
            assert.strictEqual(
                heap.pop(),
                15,
                "Pop should return the next largest element",
            );
            assert.strictEqual(
                heap.pop(),
                10,
                "Pop should return the smallest element last",
            );
        });

        it("should handle mixed positive and negative numbers", () => {
            const heap = new BinaryHeap<number>(negativeScore);
            heap.push(10);
            heap.push(-10);
            heap.push(20);
            assert.strictEqual(
                heap.pop(),
                20,
                "Pop should return the largest element first",
            );
            assert.strictEqual(
                heap.pop(),
                10,
                "Pop should return the next largest element",
            );
            assert.strictEqual(
                heap.pop(),
                -10,
                "Pop should return the smallest element last",
            );
        });
    });

    describe("String Length Scoring", () => {
        it("should order strings by length", () => {
            const heap = new BinaryHeap<string>(stringLengthScore);
            heap.push("short");
            heap.push("longer");
            heap.push("tiny");
            heap.push("a very long string");
            assert.strictEqual(
                heap.pop(),
                "tiny",
                "Pop should return the shortest string first",
            );
            assert.strictEqual(
                heap.pop(),
                "short",
                "Pop should return the next shortest string",
            );
            assert.strictEqual(
                heap.pop(),
                "longer",
                "Pop should return the next shortest string by length",
            );
            assert.strictEqual(
                heap.pop(),
                "a very long string",
                "Pop should return the longest string last",
            );
        });

        it("should handle mixed strings with ties in length", () => {
            const heap = new BinaryHeap<string>(stringLengthScore);
            heap.push("aaa"); // Length 3
            heap.push("bbb"); // Length 3
            heap.push("abc"); // Length 3
            heap.push("long"); // Length 4

            // Collect results
            const results = [heap.pop(), heap.pop(), heap.pop(), heap.pop()];

            // Assert that the three strings of length 3 can appear in any order
            const threeLengthStrings = results.slice(0, 3);
            assert.deepStrictEqual(
                new Set(threeLengthStrings),
                new Set(["aaa", "bbb", "abc"]),
                "Strings of length 3 should be in the first three pops, but order may vary",
            );

            // Assert that the string of length 4 is the last one
            assert.strictEqual(
                results[3],
                "long",
                "The string of length 4 should be the last element popped",
            );
        });
    });

    describe("Edge Cases", () => {
        it("should handle a single element correctly", () => {
            const heap = new BinaryHeap<number>(simpleScore);
            heap.push(42);
            assert.strictEqual(
                heap.pop(),
                42,
                "Pop should return the only element",
            );
        });

        it("should handle all elements being equal", () => {
            const heap = new BinaryHeap<number>(simpleScore);
            heap.push(10);
            heap.push(10);
            heap.push(10);
            assert.strictEqual(heap.pop(), 10, "Pop should return an element");
            assert.strictEqual(
                heap.pop(),
                10,
                "Pop should return the next element",
            );
            assert.strictEqual(
                heap.pop(),
                10,
                "Pop should return the remaining element",
            );
        });

        it("should work with complex objects using a scoring function", () => {
            const heap = new BinaryHeap<{ priority: number }>(
                (x) => x.priority,
            );
            heap.push({ priority: 5 });
            heap.push({ priority: 10 });
            heap.push({ priority: 1 });
            assert.deepStrictEqual(
                heap.pop(),
                { priority: 1 },
                "Pop should return the object with the smallest priority",
            );
            assert.deepStrictEqual(
                heap.pop(),
                { priority: 5 },
                "Pop should return the object with the next smallest priority",
            );
            assert.deepStrictEqual(
                heap.pop(),
                { priority: 10 },
                "Pop should return the object with the largest priority",
            );
        });
    });

    describe("Stress Tests", () => {
        it("should handle a large number of elements", () => {
            const heap = new BinaryHeap<number>(simpleScore);
            const numbers = Array.from({ length: 1000 }, (_, __) =>
                Math.floor(Math.random() * 10000),
            );
            numbers.forEach((num) => heap.push(num));
            const sorted = [...numbers].sort((a, b) => a - b);
            sorted.forEach((expected) => {
                assert.strictEqual(
                    heap.pop(),
                    expected,
                    "Popped elements should match sorted order",
                );
            });
        });
    });
});

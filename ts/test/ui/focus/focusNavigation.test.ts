import { describe, it } from "node:test";
import assert from "node:assert";
import {
    closestInDirection,
    firstInReadingOrder,
    nearestByEdge,
    type Spatial,
} from "../../../src/ui/focus/focusNavigation.ts";
import type { Bounds } from "../../../src/common/bounds.ts";
import { Direction } from "../../../src/common/direction.ts";

function target(x1: number, y1: number, x2: number, y2: number): Spatial {
    return { bounds: { x1, y1, x2, y2 } };
}

describe("closestInDirection", () => {
    // Offset away from the origin so the centre and edge-distance math is
    // actually exercised rather than cancelling out against zero.
    const current: Bounds = { x1: 40, y1: 24, x2: 50, y2: 34 };

    it("returns null when no candidate lies in the requested direction", () => {
        // Only candidate is to the left. We ask for right.
        const left = target(10, 24, 20, 34);
        assert.strictEqual(
            closestInDirection([left], current, Direction.Right),
            null,
        );
    });

    it("picks the closest-by-edge candidate among several valid ones", () => {
        const near = target(60, 24, 70, 34);
        const far = target(140, 24, 150, 34);
        const result = closestInDirection(
            [far, near],
            current,
            Direction.Right,
        );
        assert.strictEqual(result, near);
    });

    it("prefers a candidate below over one diagonally below and aside", () => {
        const below = target(40, 60, 50, 70);
        const diagonal = target(90, 50, 100, 60);
        const result = closestInDirection(
            [diagonal, below],
            current,
            Direction.Down,
        );
        assert.strictEqual(result, below);
    });
});

describe("nearestByEdge", () => {
    it("measures to the closest edge rather than the centre", () => {
        // The wide candidate's centre is far away, but its edge passes right
        // by the point we measure from.
        const from: Bounds = { x1: 50, y1: 50, x2: 50, y2: 50 };
        const wide = target(10, 54, 200, 60);
        const small = target(60, 60, 64, 64);
        assert.strictEqual(nearestByEdge([small, wide], from), wide);
    });
});

describe("firstInReadingOrder", () => {
    it("picks the candidate closest to the top left", () => {
        const topLeft = target(10, 12, 20, 22);
        const right = target(80, 12, 90, 22);
        const below = target(10, 80, 20, 90);
        assert.strictEqual(
            firstInReadingOrder([right, below, topLeft]),
            topLeft,
        );
    });
});

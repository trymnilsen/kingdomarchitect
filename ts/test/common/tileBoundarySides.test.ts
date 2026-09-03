import assert from "node:assert";
import { describe, it } from "node:test";
import { Direction } from "../../src/common/direction.ts";
import { encodePosition, type Point } from "../../src/common/point.ts";
import { tileBoundarySides } from "../../src/common/tileBoundarySides.ts";

function tileSet(points: Point[]): Set<number> {
    return new Set(points.map((point) => encodePosition(point.x, point.y)));
}

function assertSides(actual: Direction[], expected: Direction[]) {
    assert.deepStrictEqual(new Set(actual), new Set(expected));
}

describe("tileBoundarySides", () => {
    it("gives a lone tile all four sides", () => {
        const tile = { x: 12, y: 8 };

        assertSides(tileBoundarySides(tileSet([tile]), tile), [
            Direction.Up,
            Direction.Down,
            Direction.Left,
            Direction.Right,
        ]);
    });

    it("gives a tile surrounded on all sides no sides", () => {
        const centre = { x: 21, y: 16 };
        const tiles = tileSet([
            centre,
            { x: 21, y: 15 },
            { x: 21, y: 17 },
            { x: 20, y: 16 },
            { x: 22, y: 16 },
        ]);

        assertSides(tileBoundarySides(tiles, centre), []);
    });

    it("turns the inner corner of an L shape", () => {
        // One column two tiles tall, plus one tile to its right on the
        // bottom row.
        const tiles = tileSet([
            { x: 30, y: 40 },
            { x: 30, y: 41 },
            { x: 31, y: 41 },
        ]);

        assertSides(tileBoundarySides(tiles, { x: 30, y: 40 }), [
            Direction.Up,
            Direction.Left,
            Direction.Right,
        ]);
        assertSides(tileBoundarySides(tiles, { x: 30, y: 41 }), [
            Direction.Down,
            Direction.Left,
        ]);
        assertSides(tileBoundarySides(tiles, { x: 31, y: 41 }), [
            Direction.Up,
            Direction.Down,
            Direction.Right,
        ]);
    });
});

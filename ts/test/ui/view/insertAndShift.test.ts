import { describe, it } from "node:test";
import assert from "node:assert";
import {
    insertAndShift,
    type AxisPlacement,
} from "../../../src/ui/axisPlacement.ts";

describe("insertAndShift", () => {
    it("shifts nothing when inserted at the end", () => {
        const array: AxisPlacement[] = [
            { start: 0, end: 10 },
            { start: 10, end: 20 },
        ];
        insertAndShift(array, 2, { start: 20, end: 35 });
        assert.deepStrictEqual(array, [
            { start: 0, end: 10 },
            { start: 10, end: 20 },
            { start: 20, end: 35 },
        ]);
    });

    it("shifts all following elements when inserted at the beginning", () => {
        // insertAndShift overwrites array[index] in place (it does not splice).
        // Pre-size the slot at index 0 so the original entries live at 1 and 2.
        const array: AxisPlacement[] = [
            { start: 0, end: 0 },
            { start: 0, end: 10 },
            { start: 10, end: 25 },
        ];
        // inserted range is 5 wide, everything after index 0 shifts by 5
        insertAndShift(array, 0, { start: 0, end: 5 });
        assert.deepStrictEqual(array, [
            { start: 0, end: 5 },
            { start: 5, end: 15 },
            { start: 15, end: 30 },
        ]);
    });

    it("shifts only later elements when inserted in the middle", () => {
        const array: AxisPlacement[] = [
            { start: 0, end: 10 },
            { start: 10, end: 20 },
            { start: 20, end: 30 },
        ];
        // insert a range of width 4 at index 1; index 0 stays, index>1 shifts by 4
        insertAndShift(array, 1, { start: 100, end: 104 });
        assert.deepStrictEqual(array, [
            { start: 0, end: 10 },
            { start: 100, end: 104 },
            { start: 24, end: 34 },
        ]);
    });
});

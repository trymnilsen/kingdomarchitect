import { describe, it } from "node:test";
import assert from "node:assert";
import { LineSelectionMode } from "../../../src/game/interaction/selection/lineSelectionMode.ts";

describe("LineSelectionMode", () => {
    it("redraws the line from the same start on every press", () => {
        const mode = new LineSelectionMode({ x: 2, y: 3 });

        mode.setSelection({ x: 4, y: 3 });
        mode.setSelection({ x: 5, y: 3 });

        assert.deepStrictEqual(mode.getSelection(), [
            { x: 2, y: 3 },
            { x: 3, y: 3 },
            { x: 4, y: 3 },
            { x: 5, y: 3 },
        ]);
        assert.deepStrictEqual(mode.cursorSelection(), { x: 5, y: 3 });
    });

    it("pressing the start shrinks the line back to it", () => {
        const mode = new LineSelectionMode({ x: 2, y: 3 });

        mode.setSelection({ x: 4, y: 3 });
        mode.setSelection({ x: 2, y: 3 });

        assert.deepStrictEqual(mode.getSelection(), [{ x: 2, y: 3 }]);
        assert.deepStrictEqual(mode.cursorSelection(), { x: 2, y: 3 });
    });
});

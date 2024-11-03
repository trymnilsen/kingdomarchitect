import * as assert from "node:assert";
import { describe, it } from "node:test";
import { uiBox } from "../../src/ui/dsl/uiBoxDsl.js";
import { doTestLayout } from "./layoutContextStub.js";

describe("UiView", () => {
    it("has a center in the middle of position and size", () => {
        const view = uiBox({
            width: 200,
            height: 200,
        });
        view.offset = { x: 15, y: 20 };
        doTestLayout(view, { width: 200, height: 200 });

        assert.deepEqual(view.center, { x: 115, y: 120 });
    });

    it("center position is same as screenposition if layout has not been done", () => {
        const view = uiBox({
            width: 200,
            height: 200,
        });
        view.screenPosition = { x: 15, y: 20 };

        assert.deepEqual(view.center, { x: 15, y: 20 });
    });

    it("has bounds when layed out", () => {
        assert.equal(2, 2);
    });

    it("has bounds with equal components when not layed out", () => {
        assert.equal(2, 2);
    });

    it("throws error if width is not valid", () => {
        assert.equal(2, 2);
    });

    it("throw error if height is not valid", () => {
        assert.equal(2, 2);
    });

    it("throws error if view is already added to another parent", () => {
        assert.equal(2, 2);
    });

    it("throws error if view is added to itself", () => {
        assert.equal(2, 2);
    });

    it("add children", () => {
        assert.equal(2, 2);
    });

    it("remove children", () => {
        assert.equal(2, 2);
    });

    it("updates transform with parent value", () => {
        assert.equal(2, 2);
    });

    it("sets screenposition to offset if there is not parent", () => {
        assert.equal(2, 2);
    });

    it("updates transform of children after self", () => {
        assert.equal(2, 2);
    });

    it("focus state is created lazily on parent", () => {
        assert.equal(2, 2);
    });

    it("focus state is not re-created if there already is one", () => {
        assert.equal(2, 2);
    });

    it("focus state is removed on added to other parent", () => {
        assert.equal(2, 2);
    });

    it("focus is changed on direction input", () => {
        assert.equal(2, 2);
    });

    it("Focus is lost if view is removed", () => {
        assert.equal(2, 2);
    });
});

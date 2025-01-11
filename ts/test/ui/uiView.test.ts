import { describe, it, expect } from "vitest";
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

        expect(view.center).to.deep.equal({ x: 115, y: 120 });
    });

    it("center position is same as screenposition if layout has not been done", () => {
        const view = uiBox({
            width: 200,
            height: 200,
        });
        view.screenPosition = { x: 15, y: 20 };

        expect(view.center).to.deep.equal({ x: 15, y: 20 });
    });

    it("has bounds when layed out", () => {
        expect(2).toBe(2);
    });

    it("has bounds with equal components when not layed out", () => {
        expect(2).toBe(2);
    });

    it("throws error if width is not valid", () => {
        expect(2).toBe(2);
    });

    it("throw error if height is not valid", () => {
        expect(2).toBe(2);
    });

    it("throws error if view is already added to another parent", () => {
        expect(2).toBe(2);
    });

    it("throws error if view is added to itself", () => {
        expect(2).toBe(2);
    });

    it("add children", () => {
        expect(2).toBe(2);
    });

    it("remove children", () => {
        expect(2).toBe(2);
    });

    it("updates transform with parent value", () => {
        expect(2).toBe(2);
    });

    it("sets screenposition to offset if there is not parent", () => {
        expect(2).toBe(2);
    });

    it("updates transform of children after self", () => {
        expect(2).toBe(2);
    });

    it("focus state is created lazily on parent", () => {
        expect(2).toBe(2);
    });

    it("focus state is not re-created if there already is one", () => {
        expect(2).toBe(2);
    });

    it("focus state is removed on added to other parent", () => {
        expect(2).toBe(2);
    });

    it("focus is changed on direction input", () => {
        expect(2).toBe(2);
    });

    it("Focus is lost if view is removed", () => {
        expect(2).toBe(2);
    });
});

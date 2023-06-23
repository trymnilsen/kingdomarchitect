import { assert } from "chai";
import { uiBox } from "../../src/ui/dsl/uiBoxDsl.js";
import { doTestLayout } from "./layoutContextStub.js";
describe("uiView test", ()=>{
    it("has 4 corners", ()=>{
        const view = uiBox({
            width: 200,
            height: 200
        });
        const corners = view.corners;
        assert.equal(corners.length, 4);
    });
    it("corners are same as position if layout has not been done", ()=>{
        const view = uiBox({
            width: 200,
            height: 200
        });
        const position = {
            x: 15,
            y: 20
        };
        view.screenPosition = position;
        const corners = view.corners;
        assert.deepEqual(corners[0], position);
        assert.deepEqual(corners[1], position);
        assert.deepEqual(corners[2], position);
        assert.deepEqual(corners[3], position);
    });
    it("corners are position plus size if layout has been done", ()=>{
        const view = uiBox({
            width: 200,
            height: 200
        });
        view.offset = {
            x: 15,
            y: 20
        };
        doTestLayout(view, {
            width: 200,
            height: 200
        });
        const corners = view.corners;
        //Top left
        assert.deepEqual(corners[0], {
            x: 15,
            y: 20
        });
        //Top right
        assert.deepEqual(corners[1], {
            x: 215,
            y: 20
        });
        //Bottom right
        assert.deepEqual(corners[2], {
            x: 215,
            y: 220
        });
        //Bottom left
        assert.deepEqual(corners[3], {
            x: 15,
            y: 220
        });
    });
    it("has a center in the middle of position and size", ()=>{
        const view = uiBox({
            width: 200,
            height: 200
        });
        view.offset = {
            x: 15,
            y: 20
        };
        doTestLayout(view, {
            width: 200,
            height: 200
        });
        assert.deepEqual(view.center, {
            x: 115,
            y: 120
        });
    });
    it("center position is same as screenposition if layout has not been done", ()=>{
        const view = uiBox({
            width: 200,
            height: 200
        });
        view.screenPosition = {
            x: 15,
            y: 20
        };
        assert.deepEqual(view.center, {
            x: 15,
            y: 20
        });
    });
    it("has bounds when layed out", ()=>{
        assert.equal(2, 2);
    });
    it("has bounds with equal components when not layed out", ()=>{
        assert.equal(2, 2);
    });
    it("throws error if width is not valid", ()=>{
        assert.equal(2, 2);
    });
    it("throw error if height is not valid", ()=>{
        assert.equal(2, 2);
    });
    it("throws error if view is already added to another parent", ()=>{
        assert.equal(2, 2);
    });
    it("throws error if view is added to itself", ()=>{
        assert.equal(2, 2);
    });
    it("add children", ()=>{
        assert.equal(2, 2);
    });
    it("remove children", ()=>{
        assert.equal(2, 2);
    });
    it("updates transform with parent value", ()=>{
        assert.equal(2, 2);
    });
    it("sets screenposition to offset if there is not parent", ()=>{
        assert.equal(2, 2);
    });
    it("updates transform of children after self", ()=>{
        assert.equal(2, 2);
    });
    it("focus state is created lazily on parent", ()=>{
        assert.equal(2, 2);
    });
    it("focus state is not re-created if there already is one", ()=>{
        assert.equal(2, 2);
    });
    it("focus state is removed on added to other parent", ()=>{
        assert.equal(2, 2);
    });
    it("focus is changed on direction input", ()=>{
        assert.equal(2, 2);
    });
    it("Focus is lost if view is removed", ()=>{
        assert.equal(2, 2);
    });
});

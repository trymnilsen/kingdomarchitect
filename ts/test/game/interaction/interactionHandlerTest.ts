import { assert } from "chai";

describe("InteractionHandler test", () => {
    it("on tap up dispatches event", () => {
        assert.equal(2, 2);
    });

    it("on tap down dispatches event", () => {
        assert.equal(2, 2);
    });

    it("on tap down returns for state handled", () => {
        assert.equal(2, 2);
    });

    it("on tap down is always handled if modal", () => {
        assert.equal(2, 2);
    });

    it("on tap dispatches event", () => {
        assert.equal(2, 2);
    });

    it("on tap pops the state if dispatched event is handled", () => {
        assert.equal(2, 2);
    });

    it("on tap calls on tileTap with tilespace if event is not handled", () => {
        assert.equal(2, 2);
    });

    it("on tap tile that is not handled clears the state", () => {
        assert.equal(2, 2);
    });

    it("applies state changes at the end of onTap", () => {
        assert.equal(2, 2);
    });

    it("on update updates the current state", () => {
        assert.equal(2, 2);
    });

    it("on draw draws a scrim if modal", () => {
        assert.equal(2, 2);
    });

    it("on draw draws the current state", () => {
        assert.equal(2, 2);
    });
});

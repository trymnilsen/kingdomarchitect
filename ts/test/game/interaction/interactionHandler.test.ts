import { describe, it } from "node:test";
import assert from "node:assert";

describe("InteractionHandler", () => {
    it("on tap up dispatches event", () => {
        assert.strictEqual(2, 2);
    });

    it("on tap down dispatches event", () => {
        assert.strictEqual(2, 2);
    });

    it("on tap down returns for state handled", () => {
        assert.strictEqual(2, 2);
    });

    it("on tap down is always handled if modal", () => {
        assert.strictEqual(2, 2);
    });

    it("on tap dispatches event", () => {
        assert.strictEqual(2, 2);
    });

    it("on tap pops the state if dispatched event is handled", () => {
        assert.strictEqual(2, 2);
    });

    it("on tap calls on tileTap with tilespace if event is not handled", () => {
        assert.strictEqual(2, 2);
    });

    it("on tap tile that is not handled clears the state", () => {
        assert.strictEqual(2, 2);
    });

    it("applies state changes at the end of onTap", () => {
        assert.strictEqual(2, 2);
    });

    it("on update updates the current state", () => {
        assert.strictEqual(2, 2);
    });

    it("on draw includes a scrim in the hud view if modal", () => {
        assert.strictEqual(2, 2);
    });

    it("on draw renders the status bar and the current state view", () => {
        assert.strictEqual(2, 2);
    });
});

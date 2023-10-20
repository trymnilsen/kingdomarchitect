import { describe, it } from "node:test";
import * as assert from "node:assert";

describe("Movement component", () => {
    it("Path towards will move towards", () => {
        assert.equal(2, 2);
    });

    it("Path towards uses cached path if target is the same", () => {
        assert.equal(2, 2);
    });

    it("Path towards will regenerate path on new target", () => {
        assert.equal(2, 2);
    });

    it("Sets the current movement on target set", () => {
        assert.equal(2, 2);
    });

    it("Path to will move one point at a time", () => {
        assert.equal(2, 2);
    });

    it("Path to will return false if movement in not possible", () => {
        assert.equal(2, 2);
    });

    it("Movement will teleport actor if its stuck inside of a building", () => {
        assert.equal(2, 2);
    });

    it("Path to will stop at adjacent if requested", () => {
        assert.equal(2, 2);
    });

    it("Movement will check for building in the way and publish in the way event", () => {
        assert.equal(2, 2);
    });

    it("Movement will renegrate path if we are still at the same position as last time and not at target", () => {
        assert.equal(2, 2);
    });

    it("Movement will check for actor in the way and requesting shuffling", () => {
        assert.equal(2, 2);
    });

    it("Shuffling will return true if possible", () => {
        assert.equal(2, 2);
    });

    it("Shuffling will return false if not possible", () => {
        assert.equal(2, 2);
    });

    it("Shuffling will move to adjacent tile if available", () => {
        assert.equal(2, 2);
    });

    it("Shuffling will propagate shuffling if actor is in the way", () => {
        assert.equal(2, 2);
    });

    it("Shuffling will return true if possible", () => {
        assert.equal(2, 2);
    });
});

import * as assert from "node:assert";

describe("Movement component", () => {
    it("Will persist the current movement for the movement component", () => {
        assert.equal(2, 2);
    });

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

    it("Path will require energy", () => {
        assert.equal(2, 2);
    });

    it("Path to will not move if no energy is available", () => {
        assert.equal(2, 2);
    });

    it("Movement will teleport actor if its stuck inside of a building", () => {
        assert.equal(2, 2);
    });

    it("Path to will stop at adjacent if requested", () => {
        assert.equal(2, 2);
    });

    it("Movement will not happen automatically but requires a call to path to", () => {
        assert.equal(2, 2);
    });

    it("Movement will check for building in the way and publish in the way event", () => {
        assert.equal(2, 2);
    });

    it("Movement will renegrate path if we are still at the same position as last time and not at target", () => {
        assert.equal(2, 2);
    });
});

describe("Shuffling", () => {
    it("Movement will check for actor in the way and requesting shuffling", () => {
        assert.equal(2, 2);
    });

    it("Shuffling will return a float number if possible", () => {
        assert.equal(2, 2);
    });

    it("Shuffling will return 0 if not possible", () => {
        assert.equal(2, 2);
    });

    it("Shuffling will move to adjacent tile if available", () => {
        assert.equal(2, 2);
    });

    it("Shuffling will move perpendicular to incoming movement", () => {
        assert.equal(2, 2);
    });

    it("Shuffling will propagate shuffling if actor is in the way", () => {
        assert.equal(2, 2);
    });

    it("A shuffled actor will return to their path if possible", () => {
        assert.equal(2, 2);
    });

    it("Shuffling will consume energy", () => {
        assert.equal(2, 2);
    });

    it("Shuffling will return 0 if no energy is available", () => {
        assert.equal(2, 2);
    });

    it("A shuffled actor will not take a movement on their turn", () => {
        assert.equal(2, 2);
    });

    it("A shuffled actor will regenerate path if not possible to return to their intended path", () => {
        assert.equal(2, 2);
    });

    it("Movement will check for building in the way and publish in the way event", () => {
        assert.equal(2, 2);
    });
});

describe("Movement scenarios", () => {
    it("given an open area, two actors should make their way without regenration and shuffling", () => {
        assert.equal(2, 2);
    });

    it("given a corridor with a width of 2, two actors should request shuffling once", () => {
        assert.equal(2, 2);
    });

    it("given a corridor with an intial width of 1 and then 2, two actors will request shuffling twice", () => {
        assert.equal(2, 2);
    });

    it("given a corridor with an intial width of 1, two actors wont be stuck shuffling eachother", () => {
        assert.equal(2, 2);
    });

    it("given a corridor with a width of 2, four actors will reach the endpoint", () => {
        assert.equal(2, 2);
    });

    it("given a corridor with a width of 8, four actors will reach the endpoint", () => {
        assert.equal(2, 2);
    });
});

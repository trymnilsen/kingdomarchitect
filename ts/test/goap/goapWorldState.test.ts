import { describe, it } from "node:test";
import assert from "node:assert";
import {
    createWorldState,
    setState,
    getState,
    cloneWorldState,
    worldStatesEqual,
    applyEffects,
} from "../../src/game/goap/goapWorldState.ts";

/**
 * Tests for GoapWorldState - the simplified Map<string, string> representation
 * used during GOAP planning. State equality and independence are critical for
 * the A* closed set to work correctly.
 */
describe("GoapWorldState", () => {
    it("creates an empty world state", () => {
        const state = createWorldState();
        assert.strictEqual(state.size, 0);
    });

    it("sets and gets state values", () => {
        const state = createWorldState();
        setState(state, "hunger", 50);
        assert.strictEqual(getState(state, "hunger"), "50");
    });

    it("gets undefined for missing keys", () => {
        const state = createWorldState();
        assert.strictEqual(getState(state, "missing"), undefined);
    });

    it("sets boolean values as strings", () => {
        const state = createWorldState();
        setState(state, "hasFood", true);
        assert.strictEqual(getState(state, "hasFood"), "true");
    });

    it("overwrites existing values", () => {
        const state = createWorldState();
        setState(state, "hunger", 50);
        setState(state, "hunger", 100);
        assert.strictEqual(getState(state, "hunger"), "100");
    });

    it("clones world state independently", () => {
        const original = createWorldState();
        setState(original, "hunger", 50);
        setState(original, "hasFood", true);

        const cloned = cloneWorldState(original);

        // Cloned state should have same values
        assert.strictEqual(getState(cloned, "hunger"), "50");
        assert.strictEqual(getState(cloned, "hasFood"), "true");

        // Modifying clone should not affect original
        setState(cloned, "hunger", 100);
        assert.strictEqual(getState(original, "hunger"), "50");
        assert.strictEqual(getState(cloned, "hunger"), "100");
    });

    it("compares equal states as equal", () => {
        const state1 = createWorldState();
        setState(state1, "hunger", 50);
        setState(state1, "hasFood", true);

        const state2 = createWorldState();
        setState(state2, "hunger", 50);
        setState(state2, "hasFood", true);

        assert.strictEqual(worldStatesEqual(state1, state2), true);
    });

    it("compares different states as not equal", () => {
        const state1 = createWorldState();
        setState(state1, "hunger", 50);

        const state2 = createWorldState();
        setState(state2, "hunger", 100);

        assert.strictEqual(worldStatesEqual(state1, state2), false);
    });

    it("compares states with different keys as not equal", () => {
        const state1 = createWorldState();
        setState(state1, "hunger", 50);

        const state2 = createWorldState();
        setState(state2, "hasFood", true);

        assert.strictEqual(worldStatesEqual(state1, state2), false);
    });

    it("compares states with different sizes as not equal", () => {
        const state1 = createWorldState();
        setState(state1, "hunger", 50);

        const state2 = createWorldState();
        setState(state2, "hunger", 50);
        setState(state2, "hasFood", true);

        assert.strictEqual(worldStatesEqual(state1, state2), false);
    });

    it("compares empty states as equal", () => {
        const state1 = createWorldState();
        const state2 = createWorldState();
        assert.strictEqual(worldStatesEqual(state1, state2), true);
    });

    it("applies effects to state", () => {
        const state = createWorldState();
        setState(state, "hunger", 50);
        setState(state, "hasFood", true);

        const effects = createWorldState();
        setState(effects, "hunger", 10); // Reduce hunger

        const newState = applyEffects(state, effects);

        // New state should have updated hunger
        assert.strictEqual(getState(newState, "hunger"), "10");
        // New state should preserve other values
        assert.strictEqual(getState(newState, "hasFood"), "true");
        // Original state should be unchanged
        assert.strictEqual(getState(state, "hunger"), "50");
    });

    it("applies effects adding new keys", () => {
        const state = createWorldState();
        setState(state, "hunger", 50);

        const effects = createWorldState();
        setState(effects, "hasFood", true);

        const newState = applyEffects(state, effects);

        assert.strictEqual(getState(newState, "hunger"), "50");
        assert.strictEqual(getState(newState, "hasFood"), "true");
    });

    it("applies empty effects", () => {
        const state = createWorldState();
        setState(state, "hunger", 50);

        const effects = createWorldState();
        const newState = applyEffects(state, effects);

        assert.strictEqual(getState(newState, "hunger"), "50");
        assert.strictEqual(worldStatesEqual(state, newState), true);
    });

    it("handles numeric string values correctly", () => {
        const state = createWorldState();
        setState(state, "count", 42);

        const value = getState(state, "count");
        assert.strictEqual(value, "42");
        assert.strictEqual(parseInt(value || "0"), 42);
    });
});

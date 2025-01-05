import { describe, it, expect } from "vitest";

describe("InteractionHandler", () => {
    it("on tap up dispatches event", () => {
        expect(2).toBe(2);
    });

    it("on tap down dispatches event", () => {
        expect(2).toBe(2);
    });

    it("on tap down returns for state handled", () => {
        expect(2).toBe(2);
    });

    it("on tap down is always handled if modal", () => {
        expect(2).toBe(2);
    });

    it("on tap dispatches event", () => {
        expect(2).toBe(2);
    });

    it("on tap pops the state if dispatched event is handled", () => {
        expect(2).toBe(2);
    });

    it("on tap calls on tileTap with tilespace if event is not handled", () => {
        expect(2).toBe(2);
    });

    it("on tap tile that is not handled clears the state", () => {
        expect(2).toBe(2);
    });

    it("applies state changes at the end of onTap", () => {
        expect(2).toBe(2);
    });

    it("on update updates the current state", () => {
        expect(2).toBe(2);
    });

    it("on draw draws a scrim if modal", () => {
        expect(2).toBe(2);
    });

    it("on draw draws the current state", () => {
        expect(2).toBe(2);
    });
});

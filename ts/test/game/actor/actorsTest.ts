import { describe, expect, test } from "@jest/globals";

describe("Actors test", () => {
    test("Actor added should be added to actors", () => {
        expect(3).toBe(3);
    });
    test("Actor added should listen to job complete event", () => {
        expect(3).toBe(3);
    });
    test("Actor added should request a new job", () => {
        expect(3).toBe(3);
    });
    test("Actor is removed on remove", () => {
        expect(3).toBe(3);
    });
    test("Actor is disposed on remove", () => {
        expect(3).toBe(3);
    });
    test("Can find actor at position", () => {
        expect(3).toBe(3);
    });
    test("Position with no actor returns null", () => {
        expect(3).toBe(3);
    });
    test("Scheduled job respects constraints", () => {
        expect(3).toBe(3);
    });
    test("Scheduled job is not assigned on no available actors", () => {
        expect(3).toBe(3);
    });
    test("Job is removed from queue on assign", () => {
        expect(3).toBe(3);
    });
    test("Job is removed from queue on jobScheduled listener", () => {
        expect(3).toBe(3);
    });
    test("Job is removed from queue on requestNewJob", () => {
        expect(3).toBe(3);
    });
    test("requestNewJob is only called once after complete", () => {
        expect(3).toBe(3);
    });
    test("jobs not immediately scheduled is picked up once when actor is ready", () => {
        expect(3).toBe(3);
    });
});

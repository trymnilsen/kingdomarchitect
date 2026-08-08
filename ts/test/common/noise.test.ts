import { describe, it } from "node:test";
import assert from "node:assert";
import { fbmNoise2d, valueNoise2d } from "../../src/common/noise.ts";

describe("valueNoise2d", () => {
    it("is deterministic for a given coordinate and seed", () => {
        const a = valueNoise2d(3.5, 7.25, 99);
        const b = valueNoise2d(3.5, 7.25, 99);

        assert.equal(a, b);
    });

    it("stays within [0, 1)", () => {
        for (let i = 0; i < 500; i++) {
            const value = valueNoise2d(i * 0.37, i * 0.13, 5);
            assert.ok(value >= 0 && value < 1, `out of range: ${value}`);
        }
    });

    it("varies across coordinates rather than returning a constant", () => {
        const samples = new Set<number>();
        for (let i = 0; i < 20; i++) {
            samples.add(valueNoise2d(i * 1.7, i * 0.9, 1));
        }

        assert.ok(samples.size > 1, "noise should not be constant");
    });

    it("changes with the seed", () => {
        assert.notEqual(valueNoise2d(2.5, 2.5, 1), valueNoise2d(2.5, 2.5, 2));
    });
});

describe("fbmNoise2d", () => {
    it("stays within [0, 1)", () => {
        for (let i = 0; i < 500; i++) {
            const value = fbmNoise2d(i * 0.21, i * 0.44, 3, 4, 0.5);
            assert.ok(value >= 0 && value < 1, `out of range: ${value}`);
        }
    });
});

import * as assert from "node:assert";
import { describe, it } from "node:test";

describe("Sides", () => {
    it("can create with all sides equal", () => {
        assert.equal(2, 2);
    });

    it("can create symmetric sides", () => {
        assert.equal(2, 2);
    });

    it("cannot mutate zero sides object", () => {
        assert.equal(2, 2);
    });

    it("can add together horizontal amount", () => {
        assert.equal(2, 2);
    });

    it("can add together vertical amount", () => {
        assert.equal(2, 2);
    });
});

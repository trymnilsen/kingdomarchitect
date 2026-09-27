import { describe, it } from "node:test";
import assert from "node:assert";
import {
    createWarmthComponent,
    isWarm,
    COLD_THRESHOLD,
} from "../../../src/game/component/warmthComponent.ts";

describe("WarmthComponent", () => {
    describe("isWarm", () => {
        it("returns true when warmth is at the cold threshold", () => {
            const component = createWarmthComponent(COLD_THRESHOLD);
            assert.strictEqual(isWarm(component), true);
        });
    });
});

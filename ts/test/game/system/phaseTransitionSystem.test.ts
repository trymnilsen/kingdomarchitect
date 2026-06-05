import { describe, it } from "node:test";
import assert from "node:assert";
import {
    derivePhaseState,
    DAWN_TICKS,
    DAY_TICKS,
    DUSK_TICKS,
    TOTAL_CYCLE_TICKS,
} from "../../../src/game/component/dayComponent.ts";

describe("derivePhaseState", () => {
    it("maps tick 0 to dawn", () => {
        assert.strictEqual(derivePhaseState(0).phase, "dawn");
    });

    it("maps tick at start of day to day", () => {
        assert.strictEqual(derivePhaseState(DAWN_TICKS).phase, "day");
    });

    it("maps tick at start of dusk to dusk", () => {
        assert.strictEqual(
            derivePhaseState(DAWN_TICKS + DAY_TICKS).phase,
            "dusk",
        );
    });

    it("maps tick at start of night to night", () => {
        assert.strictEqual(
            derivePhaseState(DAWN_TICKS + DAY_TICKS + DUSK_TICKS).phase,
            "night",
        );
    });

    it("wraps back to dawn at the start of the next cycle", () => {
        assert.strictEqual(derivePhaseState(TOTAL_CYCLE_TICKS).phase, "dawn");
    });
});

describe("daysSurvived", () => {
    it("is 0 on the last tick before the first rollover", () => {
        assert.strictEqual(
            derivePhaseState(TOTAL_CYCLE_TICKS - 1).daysSurvived,
            0,
        );
    });

    it("increments to 1 exactly at the dawn rollover", () => {
        assert.strictEqual(
            derivePhaseState(TOTAL_CYCLE_TICKS).daysSurvived,
            1,
        );
    });

    it("stays at 1 on the tick after the rollover", () => {
        assert.strictEqual(
            derivePhaseState(TOTAL_CYCLE_TICKS + 1).daysSurvived,
            1,
        );
    });
});

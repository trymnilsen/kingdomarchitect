import assert from "node:assert";
import { describe, it } from "node:test";
import {
    createMovementStaminaComponent,
    hasMovedThisTick,
    recordMove,
} from "../../../src/game/component/movementStaminaComponent.ts";

describe("movementStaminaComponent", () => {
    it("reports no move before the entity has ever moved", () => {
        const component = createMovementStaminaComponent();

        assert.strictEqual(hasMovedThisTick(component, 0), false);
        assert.strictEqual(hasMovedThisTick(component, 10), false);
    });

    it("gates only the tick the entity moved on", () => {
        const component = createMovementStaminaComponent();
        recordMove(component, 10);

        assert.strictEqual(hasMovedThisTick(component, 10), true);
        assert.strictEqual(hasMovedThisTick(component, 11), false);
        assert.strictEqual(hasMovedThisTick(component, 9), false);
    });

    it("follows the newest move, so an earlier tick stops gating", () => {
        const component = createMovementStaminaComponent();
        recordMove(component, 5);
        recordMove(component, 7);

        assert.strictEqual(hasMovedThisTick(component, 7), true);
        assert.strictEqual(hasMovedThisTick(component, 5), false);
    });
});

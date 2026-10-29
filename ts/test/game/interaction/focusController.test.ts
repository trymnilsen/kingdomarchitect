import { describe, it } from "node:test";
import assert from "node:assert";
import { FocusController } from "../../../src/game/interaction/focus/focusController.ts";
import {
    FocusDomain,
    worldFirstFocus,
} from "../../../src/game/interaction/focus/focusDomain.ts";
import { InteractionState } from "../../../src/game/interaction/handler/interactionState.ts";
import { InputActionType } from "../../../src/input/inputAction.ts";
import type { Bounds } from "../../../src/common/bounds.ts";
import type { Direction } from "../../../src/common/direction.ts";
import type { RenderedFocusGroup } from "../../../src/ui/focus/focusGroup.ts";

type FakeGroup = RenderedFocusGroup & {
    moves: Direction[];
    activations: number;
    enteredNear: (Bounds | null)[];
    blurs: number;
};

function fakeGroup(focused: Bounds | null): FakeGroup {
    const group: FakeGroup = {
        moves: [],
        activations: 0,
        enteredNear: [],
        blurs: 0,
        focusedBounds: () => focused,
        enterFocus(near) {
            group.enteredNear.push(near);
            return true;
        },
        moveFocus(direction) {
            group.moves.push(direction);
            return true;
        },
        activateFocused() {
            group.activations += 1;
            return true;
        },
        blurFocus() {
            group.blurs += 1;
        },
        clearFocus() {},
        enterFocusAfterLayout() {},
    };
    return group;
}

/** A state whose offered domains a test can change while it is active. */
class DomainState extends InteractionState {
    domains: readonly FocusDomain[];

    constructor(domains: readonly FocusDomain[]) {
        super();
        this.domains = domains;
    }

    override get focusDomains(): readonly FocusDomain[] {
        return this.domains;
    }
}

describe("FocusController", () => {
    it("sends directions and the action key to the active domain only", () => {
        const world = fakeGroup(null);
        const hud = fakeGroup(null);
        const focus = new FocusController(hud, world);
        const state = new DomainState(worldFirstFocus);

        focus.handleKey(InputActionType.RIGHT_PRESS, state);
        focus.handleKey(InputActionType.ACTION_PRESS, state);

        assert.deepStrictEqual(world.moves, ["right"]);
        assert.strictEqual(world.activations, 1);
        assert.deepStrictEqual(hud.moves, []);
        assert.strictEqual(hud.activations, 0);
    });

    it("cycling blurs the domain left and enters the next near the old focus", () => {
        const selection = { x1: 40, y1: 40, x2: 72, y2: 72 };
        const world = fakeGroup(selection);
        const hud = fakeGroup(null);
        const focus = new FocusController(hud, world);
        const state = new DomainState(worldFirstFocus);

        const handled = focus.handleKey(
            InputActionType.FOCUS_CYCLE_PRESS,
            state,
        );

        assert.strictEqual(handled, true);
        assert.strictEqual(world.blurs, 1);
        assert.deepStrictEqual(hud.enteredNear, [selection]);

        focus.handleKey(InputActionType.UP_PRESS, state);
        assert.deepStrictEqual(hud.moves, ["up"], "the keys now go to the HUD");

        focus.handleKey(InputActionType.FOCUS_CYCLE_PRESS, state);
        focus.handleKey(InputActionType.DOWN_PRESS, state);
        assert.deepStrictEqual(world.moves, ["down"], "cycling wraps around");
    });

    it("a pointer press moves the keys to the domain it landed in", () => {
        const world = fakeGroup(null);
        const hud = fakeGroup(null);
        const focus = new FocusController(hud, world);
        const state = new DomainState(worldFirstFocus);

        focus.followPointer(FocusDomain.Hud, state);
        focus.handleKey(InputActionType.LEFT_PRESS, state);

        assert.deepStrictEqual(hud.moves, ["left"]);
        assert.deepStrictEqual(world.moves, []);
    });

    it("falls back to the first domain once the picked one is no longer offered", () => {
        const world = fakeGroup(null);
        const hud = fakeGroup(null);
        const focus = new FocusController(hud, world);
        const state = new DomainState(worldFirstFocus);
        focus.followPointer(FocusDomain.World, state);

        state.domains = [FocusDomain.Hud];
        focus.handleKey(InputActionType.UP_PRESS, state);

        assert.deepStrictEqual(hud.moves, ["up"]);
        assert.deepStrictEqual(world.moves, []);
    });
});

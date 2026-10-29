import type { Bounds } from "../../../common/bounds.ts";
import { InputType } from "../../../input/input.ts";
import {
    getDirectionFromInputType,
    InputActionType,
} from "../../../input/inputAction.ts";
import type {
    FocusGroup,
    RenderedFocusGroup,
} from "../../../ui/focus/focusGroup.ts";
import type { InteractionState } from "../handler/interactionState.ts";
import { FocusDomain } from "./focusDomain.ts";

/** What the controller remembers about a state while it is in the history. */
type StateFocus = {
    /** The domain the keys go to, null until the player picks one. */
    domain: FocusDomain | null;
    /** Where HUD focus was when another state covered this one. */
    hudRestore: Bounds | null;
};

/**
 * Decides where focus is across the whole interaction. Each state offers the
 * focus domains that make sense for it, and the controller keeps track of
 * which one the keys drive and carries HUD focus from one state to the next.
 *
 * Pointer and keyboard share the same focus. A pointer press moves the keys
 * to the domain it landed in, so the next key press continues where the player
 * was looking rather than where the keys last were.
 */
export class FocusController {
    private hud: RenderedFocusGroup;
    private world: FocusGroup;
    // Kept per state so popping a modal returns the keys to where they were in
    // the state below. Weak so a state's memory goes away with the state.
    private memory = new WeakMap<InteractionState, StateFocus>();

    constructor(hud: RenderedFocusGroup, world: FocusGroup) {
        this.hud = hud;
        this.world = world;
    }

    /**
     * Applies a key press to the state's focus: directions move within the
     * active domain, the action key activates what it has focused, and the
     * cycle key hands the keys to the next domain.
     * @returns whether the key was used
     */
    handleKey(action: InputActionType, state: InteractionState): boolean {
        const domain = this.activeDomain(state);
        if (!domain) {
            return false;
        }
        const group = this.groupFor(domain);

        const direction = getDirectionFromInputType(action);
        if (direction) {
            return group.moveFocus(direction);
        }

        switch (action) {
            case InputActionType.ACTION_PRESS:
                return group.activateFocused();
            case InputActionType.FOCUS_CYCLE_PRESS:
                return this.cycleDomain(state, domain);
            default:
                return false;
        }
    }

    /**
     * A pointer press landed in `domain`, which is where the player's
     * attention now is. Ignored when the state does not offer that domain.
     */
    followPointer(domain: FocusDomain, state: InteractionState): void {
        if (state.focusDomains.includes(domain)) {
            this.memoryOf(state).domain = domain;
        }
    }

    /**
     * Carries focus from one state to the next. Someone using the keyboard
     * keeps a visible HUD focus across the change, while someone tapping never
     * sees one.
     *
     * Runs before the new state's view is rendered, so the HUD still holds the
     * previous state's focus for it to remember.
     */
    handOver(
        previous: InteractionState,
        current: InteractionState,
        source: InputType,
    ): void {
        this.memoryOf(previous).hudRestore = this.hud.focusedBounds();
        this.hud.clearFocus();

        const keysGoToHud = this.activeDomain(current) === FocusDomain.Hud;
        if (source === InputType.Keyboard && keysGoToHud) {
            this.hud.enterFocusAfterLayout(this.memoryOf(current).hudRestore);
        }
    }

    /**
     * Hands the keys to the next domain, entering it next to where focus was
     * in the one being left. Going from the world to the HUD then lands on the
     * button nearest the selection.
     */
    private cycleDomain(state: InteractionState, from: FocusDomain): boolean {
        const domains = state.focusDomains;
        if (domains.length < 2) {
            return false;
        }

        const to = domains[(domains.indexOf(from) + 1) % domains.length];
        const fromGroup = this.groupFor(from);
        const near = fromGroup.focusedBounds();
        fromGroup.blurFocus();
        this.memoryOf(state).domain = to;
        this.groupFor(to).enterFocus(near);
        return true;
    }

    /**
     * The domain the keys go to: the one the player last picked in this state
     * when it still offers it, otherwise the state's first.
     */
    private activeDomain(state: InteractionState): FocusDomain | null {
        const domains = state.focusDomains;
        const picked = this.memory.get(state)?.domain;
        if (picked && domains.includes(picked)) {
            return picked;
        }
        return domains[0] ?? null;
    }

    private groupFor(domain: FocusDomain): FocusGroup {
        switch (domain) {
            case FocusDomain.Hud:
                return this.hud;
            case FocusDomain.World:
                return this.world;
        }
    }

    private memoryOf(state: InteractionState): StateFocus {
        let stateFocus = this.memory.get(state);
        if (!stateFocus) {
            stateFocus = { domain: null, hudRestore: null };
            this.memory.set(state, stateFocus);
        }
        return stateFocus;
    }
}

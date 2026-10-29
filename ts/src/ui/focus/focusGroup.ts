import { type Bounds } from "../../common/bounds.ts";
import { Direction } from "../../common/direction.ts";

/**
 * One independently navigable domain that keyboard input can drive, such as
 * the HUD or the world. Directional keys move within the active group and a
 * separate key switches groups. Focus is never handed from one group to the
 * next by direction, because the world lies behind the whole HUD and "off the
 * edge of the HUD" has no meaningful direction.
 *
 * What focus means is up to the group. On the HUD it is a highlighted button
 * that the action key presses. In the world the selection itself is the focus,
 * so moving focus selects.
 */
export interface FocusGroup {
    /** Screen bounds of what has focus, or null when nothing visibly does. */
    focusedBounds(): Bounds | null;

    /**
     * Makes sure something has focus. Keeps the current focus when there is
     * one, otherwise focuses the target nearest `near`, or the group's own
     * idea of where to start when `near` is null.
     * @returns whether something has focus afterwards
     */
    enterFocus(near: Bounds | null): boolean;

    /** @returns false when there is nothing to move to in that direction */
    moveFocus(direction: Direction): boolean;

    /** Does what pressing the focused target would. */
    activateFocused(): boolean;

    /** Drops visible focus, remembering where it was for the next enter. */
    blurFocus(): void;
}

/**
 * A focus group whose targets only exist once a render has laid them out, and
 * which the next render can replace wholesale, like a HUD whose view changes
 * with the interaction state.
 */
export interface RenderedFocusGroup extends FocusGroup {
    /**
     * Drops focus and forgets where it was. For when every target is about to
     * be replaced, since positions on the old view say nothing about the new.
     */
    clearFocus(): void;

    /**
     * Enters focus near `near` once the next render has laid out the targets.
     * Entering right away would land on a target that is about to go away.
     */
    enterFocusAfterLayout(near: Bounds | null): void;
}

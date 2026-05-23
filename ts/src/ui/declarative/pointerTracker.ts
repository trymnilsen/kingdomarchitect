import type { UiNode } from "./ui.ts";

/**
 * Pointer-interaction flags a component reads via `withPointerState()`. A flag
 * is true when the component instance is part of that interaction chain. The
 * hovered flag isn't wired to any input yet. See {@link PointerTracker.setHovered}.
 */
export type PointerFlags = { pressed: boolean; hovered: boolean };

/**
 * Stores which component instances are currently pressed, and later hovered.
 * The UiRenderer composes one of these so the state lives in one place outside
 * the renderer's own fields.
 *
 * The state is a set of nodes because a single pointer can sit over a whole
 * ancestry chain at once. A container and the button inside it can both be
 * pressed. The chain comes from the hit-test in pointerChainAt and gets passed
 * to setPressed or setHovered.
 *
 * To add another relationship later, like focus or drag-over, add a set and a
 * method for it here.
 */
export class PointerTracker {
    private pressed = new Set<UiNode>();
    private hovered = new Set<UiNode>();

    /**
     * Replaces the pressed chain. Pass the whole chain from outermost to
     * innermost so every node in it reads as pressed. Pass an empty array to
     * clear it.
     */
    setPressed(chain: UiNode[]): void {
        this.pressed = new Set(chain);
    }

    /** Clears the pressed chain. Called on pointer up, cancel, or drag start. */
    clearPressed(): void {
        this.pressed.clear();
    }

    /**
     * Replaces the hovered chain. Nothing calls this yet. Hover will get an
     * input source once pointer-move is forwarded to the renderer. It's here
     * now to keep the hover shape in place.
     */
    setHovered(chain: UiNode[]): void {
        this.hovered = new Set(chain);
    }

    /** Clears the hovered chain. */
    clearHovered(): void {
        this.hovered.clear();
    }

    /**
     * Removes a node from every relationship. The renderer calls this when a
     * node unmounts so a component that disappears mid-press leaves nothing
     * behind.
     */
    forget(node: UiNode): void {
        this.pressed.delete(node);
        this.hovered.delete(node);
    }

    /** Whether a node is in the pressed chain. */
    isPressed(node: UiNode): boolean {
        return this.pressed.has(node);
    }

    /**
     * Answers "is the pointer on this node right now?" for one component,
     * reached through withPointerState during render. A button uses the pressed
     * flag to draw itself pressed. The answer is read from the chains each
     * render rather than stored, so it can never go stale.
     */
    flagsFor(node: UiNode): PointerFlags {
        return {
            pressed: this.pressed.has(node),
            hovered: this.hovered.has(node),
        };
    }
}

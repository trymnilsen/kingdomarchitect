import type { UiNode } from "./ui.ts";

/**
 * Pointer-interaction flags a component reads via `withPointerState()`. A flag
 * is true when the component instance is part of that interaction chain. The
 * hovered flag isn't wired to any input yet. See {@link PointerTracker.setHovered}.
 */
export type PointerFlags = { pressed: boolean; hovered: boolean };

/**
 * Stores the pointer-capture state for the current gesture, and later hover.
 * The UiRenderer composes one of these so the state lives in one place outside
 * the renderer's own fields.
 *
 * A gesture follows capture semantics: the interactive chain hit on pointer
 * down becomes the captured chain and owns the gesture until it ends. The
 * captured set decides tap eligibility on release. The pressed set is the
 * visual subset of it — the captured nodes currently under the pointer — so a
 * button un-presses when the pointer slides off it and re-presses when the
 * pointer slides back, while staying eligible to tap the whole time.
 *
 * The state is a set of nodes because a single pointer can sit over a whole
 * ancestry chain at once. A container and the button inside it can both be
 * captured. The chain comes from the hit-test in pointerChainAt.
 *
 * To add another relationship later, like focus or drag-over, add a set and a
 * method for it here.
 */
export class PointerTracker {
    private captured = new Set<UiNode>();
    private pressed = new Set<UiNode>();
    private hovered = new Set<UiNode>();
    private captureActive = false;

    /**
     * Begins a gesture. Pass the whole chain hit on pointer down, outermost to
     * innermost. Every node in it becomes captured and pressed. An empty chain
     * leaves the tracker without a capture.
     */
    beginCapture(chain: UiNode[]): void {
        this.captured = new Set(chain);
        this.pressed = new Set(chain);
        this.captureActive = chain.length > 0;
    }

    /**
     * Updates the pressed visuals as the pointer moves during a capture. Pass
     * the chain currently under the pointer; the pressed set becomes its
     * intersection with the captured chain. Does nothing without a capture.
     */
    moveCapture(chainUnderPointer: UiNode[]): void {
        if (!this.captureActive) {
            return;
        }
        this.pressed = new Set(
            chainUnderPointer.filter((node) => this.captured.has(node)),
        );
    }

    /** Ends the gesture. Called on pointer up or cancel. */
    endCapture(): void {
        this.captured.clear();
        this.pressed.clear();
        this.captureActive = false;
    }

    /**
     * Whether a gesture is in progress. Stays true even if every captured node
     * has been forgotten, so a release after the pressed subtree unmounts is
     * still absorbed by the UI instead of leaking to whatever is behind it.
     */
    hasCapture(): boolean {
        return this.captureActive;
    }

    /** Whether a node is in the captured chain. Decides tap eligibility. */
    isCaptured(node: UiNode): boolean {
        return this.captured.has(node);
    }

    /**
     * Replaces the hovered chain. Nothing calls this yet. Hover will get an
     * input source once pointer-move outside a capture is forwarded to the
     * renderer. It's here now to keep the hover shape in place.
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
     * behind. The capture itself stays active, see {@link hasCapture}.
     */
    forget(node: UiNode): void {
        this.captured.delete(node);
        this.pressed.delete(node);
        this.hovered.delete(node);
    }

    /** Whether a node is in the pressed visual set. */
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

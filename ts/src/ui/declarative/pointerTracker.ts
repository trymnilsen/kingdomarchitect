import type { UiNode } from "./ui.ts";

/**
 * The pointer-interaction flags a component can read for itself via
 * `withPointerState()`. Each flag is true when this component instance is part
 * of the corresponding interaction chain.
 *
 * `hovered` is part of the model today but is not yet driven by any input — see
 * {@link PointerTracker.setHovered}.
 */
export type PointerFlags = { pressed: boolean; hovered: boolean };

/**
 * Owns which component instances are currently in a pointer relationship
 * (pressed now; hovered later). The `UiRenderer` composes one of these instead
 * of holding loose `pressedNode`/`hoveredNode` fields — keeping the bounded
 * "what is the pointer touching" concept in one place rather than smearing it
 * across the renderer.
 *
 * State is stored as a *set of nodes*, not a single node, because one pointer
 * can be over a whole ancestry chain at once (a container and the button inside
 * it are both "pressed"). The chain is produced by the hit-test
 * (`pointerChainAt`) and handed in via {@link setPressed} / {@link setHovered}.
 *
 * Adding a future relationship (focus, drag-over) is another Set + method pair
 * here — never a new field on the renderer.
 */
export class PointerTracker {
    private pressed = new Set<UiNode>();
    private hovered = new Set<UiNode>();

    /**
     * Replace the pressed chain. Pass the full chain (outermost → innermost) so
     * every node along it reports `pressed`; pass `[]` to clear.
     */
    setPressed(chain: UiNode[]): void {
        this.pressed = new Set(chain);
    }

    /** Clear the pressed chain (pointer up, cancel, or drag start). */
    clearPressed(): void {
        this.pressed.clear();
    }

    /**
     * Replace the hovered chain. Not yet called — hover has no input source
     * until pointer-move is forwarded to the renderer. Present so the hover
     * shape is proven and additive.
     */
    setHovered(chain: UiNode[]): void {
        this.hovered = new Set(chain);
    }

    /** Clear the hovered chain. */
    clearHovered(): void {
        this.hovered.clear();
    }

    /**
     * Drop a node from every relationship. Called when a node unmounts so a
     * pressed/hovered component that disappears mid-interaction cannot leave a
     * stale reference behind (the invalidation that prevents stuck states).
     */
    forget(node: UiNode): void {
        this.pressed.delete(node);
        this.hovered.delete(node);
    }

    /** Whether a node is currently in the pressed chain. */
    isPressed(node: UiNode): boolean {
        return this.pressed.has(node);
    }

    /**
     * The current interaction flags for a node, derived fresh from membership.
     * Called once per interactive component per render.
     */
    flagsFor(node: UiNode): PointerFlags {
        return {
            pressed: this.pressed.has(node),
            hovered: this.hovered.has(node),
        };
    }
}

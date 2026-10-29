import type { Bounds } from "../../common/bounds.ts";
import type { Point } from "../../common/point.ts";
import {
    boundsFromRectangle,
    intersectRect,
    pointWithinRectangle,
    type Rectangle,
} from "../../common/structure/rectangle.ts";
import type { UiNode } from "./ui.ts";

/**
 * The interactive nodes under `point`, outermost first, so a card and the
 * button inside it can both react to the same press.
 *
 * When regions overlap, ordering picks the winner. A node is recorded before
 * its children, and earlier siblings before later ones, and the last hit
 * recorded wins. That works out to the deepest node inside the last-drawn
 * sibling, which is the one on top.
 *
 * @param root The tree root to search.
 * @param point The point to hit-test, in the same space as node.layout.region.
 * @param isInteractive Tells which nodes opted into pointer tracking, via
 *     withPointerState or withPointerTap.
 */
export function pointerChainAt(
    root: UiNode,
    point: Point,
    isInteractive: (node: UiNode) => boolean,
): UiNode[] {
    let winner: UiNode[] = [];

    // The point itself is all a clip needs to rule on: either it is inside
    // every clip above a node or the node can't be hit.
    walkInteractiveNodes<true>(
        root,
        isInteractive,
        true,
        (_, clip) => (pointWithinRectangle(point, clip) ? true : null),
        (node, _, ancestors) => {
            const region = node.layout?.region;
            if (region && pointWithinRectangle(point, region)) {
                // Later records overwrite earlier ones, so the final value is
                // the node drawn on top.
                winner = [...ancestors, node];
            }
        },
    );

    return winner;
}

/**
 * A node keyboard focus can move to, with what of it can be seen.
 */
export type FocusCandidate = {
    node: UiNode;
    /** Clipped to the visible part, so a focus ring never frames hidden pixels. */
    bounds: Bounds;
    /**
     * Focusable ancestors, outermost first. Navigation skips the relatives of
     * the focused node, since a card wrapping a button would otherwise lie in
     * every direction from it.
     */
    ancestors: readonly UiNode[];
};

/**
 * Every focusable node that can be seen within `viewport`, in draw order.
 * Nodes scrolled out of a clip or pushed off screen are left out, the same as
 * they are for taps.
 */
export function focusCandidates(
    root: UiNode,
    viewport: Rectangle,
    isFocusable: (node: UiNode) => boolean,
): FocusCandidate[] {
    const candidates: FocusCandidate[] = [];

    walkInteractiveNodes<Rectangle>(
        root,
        isFocusable,
        viewport,
        intersectRect,
        (node, visible, ancestors) => {
            const region = node.layout?.region;
            const visiblePart = region ? intersectRect(region, visible) : null;
            if (visiblePart) {
                candidates.push({
                    node,
                    bounds: boundsFromRectangle(visiblePart),
                    ancestors: [...ancestors],
                });
            }
        },
    );

    return candidates;
}

/**
 * Depth first walk over the interactive nodes, in draw order. A clipping node
 * hides whatever its subtree draws outside it, so `narrow` is asked what is
 * still within reach inside the clip, and the subtree is skipped when the
 * answer is null. Hit-testing and focus both walk this way so a clip can never
 * hide a node from one of them but not the other.
 *
 * @param within what is in reach at the root, such as the viewport
 * @param visit called for each interactive node with what is in reach there
 *     and the interactive ancestors above it, outermost first
 */
function walkInteractiveNodes<T>(
    root: UiNode,
    isInteractive: (node: UiNode) => boolean,
    within: T,
    narrow: (within: T, clip: Rectangle) => T | null,
    visit: (node: UiNode, within: T, ancestors: readonly UiNode[]) => void,
): void {
    const ancestors: UiNode[] = [];

    function walk(node: UiNode, nodeWithin: T): void {
        const interactive = isInteractive(node);
        if (interactive) {
            visit(node, nodeWithin, ancestors);
        }

        let childWithin: T | null = nodeWithin;
        if (node.layout?.clip === true) {
            const region = node.layout.region;
            childWithin = region ? narrow(nodeWithin, region) : null;
        }
        if (childWithin === null) {
            return;
        }

        if (interactive) {
            ancestors.push(node);
        }
        for (const child of node.children) {
            walk(child, childWithin);
        }
        if (interactive) {
            ancestors.pop();
        }
    }

    walk(root, within);
}

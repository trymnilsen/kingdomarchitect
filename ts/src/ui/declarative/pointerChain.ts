import type { Point } from "../../common/point.ts";
import { withinRectangle } from "../../common/structure/rectangle.ts";
import type { UiNode } from "./ui.ts";

/**
 * Finds the interactive nodes under `point`, ordered from the outermost down to
 * the deepest one. A node only counts when `isInteractive` returns true for it,
 * so a plain layout container sitting between an interactive ancestor and the
 * pressed leaf is left out.
 *
 * The result is a chain so that nested interactive nodes can both react. A card
 * and a button inside it can both show the interaction.
 *
 * When regions overlap, ordering picks the winner. A node is recorded before
 * its children, and earlier siblings before later ones, and the last hit
 * recorded wins. That works out to the deepest node inside the last-drawn
 * sibling, which is the one on top.
 *
 * The walk needs no parent links. The ancestors stack built during the descent
 * already holds the path, so this just reads the tree and stores nothing.
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
    const ancestors: UiNode[] = [];
    let winner: UiNode[] = [];

    function visit(node: UiNode): void {
        const interactive = isInteractive(node);
        if (interactive) {
            ancestors.push(node);
        }

        const region = node.layout?.region;
        if (interactive && region && withinRectangle(point, region)) {
            // Record the path to this hit. Later records overwrite earlier
            // ones, so the final value is the node drawn on top.
            winner = [...ancestors];
        }

        for (const child of node.children) {
            visit(child);
        }

        if (interactive) {
            ancestors.pop();
        }
    }

    visit(root);
    return winner;
}

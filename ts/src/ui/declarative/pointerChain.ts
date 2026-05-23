import type { Point } from "../../common/point.ts";
import { withinRectangle } from "../../common/structure/rectangle.ts";
import type { UiNode } from "./ui.ts";

/**
 * Returns the interactive ancestry chain under `point`, ordered outermost →
 * innermost. Only nodes for which `isInteractive` returns true are included, so
 * a non-interactive layout container between an interactive ancestor and the
 * pressed leaf is transparently skipped.
 *
 * The chain is a *set of nodes*, not a single node, so a container and the
 * button nested inside it both end up in the result and can both reflect the
 * interaction (e.g. press/hover styling on the card and its button at once).
 *
 * Z-order falls out of pre-order capture: a node is recorded before its
 * children are visited, and later writes win, so a deeper node — or a
 * later-drawn (visually on top) sibling — overwrites an earlier candidate. The
 * final result is therefore the chain to the topmost, innermost interactive
 * node under the point.
 *
 * No parent pointers are required: the descent's own `ancestors` stack carries
 * the ancestry, so this stays a pure read over the existing tree with nothing
 * to keep in sync.
 *
 * @param root The tree root to search.
 * @param point The point to hit-test, in the same absolute space as
 *     `node.layout.region`.
 * @param isInteractive Predicate marking which nodes opted into pointer
 *     tracking (via `withPointerState` / `withPointerTap`).
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
            // Snapshot the path to this hit. Visiting order (node before its
            // children, earlier siblings before later) means the last snapshot
            // wins, which is the topmost innermost interactive node.
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

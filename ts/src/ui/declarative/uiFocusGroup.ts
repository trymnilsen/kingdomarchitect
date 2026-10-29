import type { Bounds } from "../../common/bounds.ts";
import type { Direction } from "../../common/direction.ts";
import type { Point } from "../../common/point.ts";
import { boundsFromRectangle } from "../../common/structure/rectangle.ts";
import type { RenderedFocusGroup } from "../focus/focusGroup.ts";
import {
    closestInDirection,
    firstInReadingOrder,
    nearestByEdge,
} from "../focus/focusNavigation.ts";
import type { FocusCandidate } from "./interactiveNodes.ts";
import type { UiNode } from "./ui.ts";

type FocusEntry = { near: Bounds | null };

/**
 * Keyboard focus over a rendered declarative tree. Anything with a tap handler
 * can take focus, the directions move between them by where they sit on
 * screen, and activating runs the same tap handler a pointer release would.
 *
 * Focus is only shown while the keyboard is in use. A pointer press hides it,
 * and the next key press picks up from where the press was.
 */
export class UiFocusGroup implements RenderedFocusGroup {
    private collectCandidates: () => FocusCandidate[];
    private activate: (node: UiNode) => boolean;
    private focused: UiNode | null = null;
    // Where an enter without a hint starts, such as the first key press after
    // a pointer press hid focus.
    private resumeAt: Bounds | null = null;
    // Focus to enter once the next render has laid the tree out. Set when the
    // focused node unmounts, so removing a list row never strands focus, and
    // when entry is asked for before the new targets exist.
    private pendingEntry: FocusEntry | null = null;
    // Which nodes can take focus only changes when a render lays the tree out,
    // so the walk runs once per render rather than on every query.
    private candidateCache: FocusCandidate[] | null = null;

    /**
     * @param collectCandidates walks the current tree for the nodes that can
     *     take focus and can be seen
     * @param activate runs a node's tap handler, false when it has none
     */
    constructor(
        collectCandidates: () => FocusCandidate[],
        activate: (node: UiNode) => boolean,
    ) {
        this.collectCandidates = collectCandidates;
        this.activate = activate;
    }

    focusedBounds(): Bounds | null {
        return this.focusedCandidate()?.bounds ?? null;
    }

    enterFocus(near: Bounds | null): boolean {
        if (this.focusedCandidate()) {
            return true;
        }

        const candidates = this.candidates();
        const hint = near ?? this.resumeAt;
        let target: FocusCandidate | null;
        if (hint) {
            target = nearestByEdge(candidates, hint);
        } else {
            target = firstInReadingOrder(candidates);
        }

        if (!target) {
            return false;
        }
        this.focusNode(target.node);
        return true;
    }

    moveFocus(direction: Direction): boolean {
        const current = this.focusedCandidate();
        if (!current) {
            // Nothing visibly focused, so the first press only shows where
            // focus is instead of jumping from a place the player can't see.
            return this.enterFocus(null);
        }

        // A card wrapping a button would otherwise lie in every direction
        // from it, so focus never moves between relatives.
        const unrelated = this.candidates().filter(
            (candidate) =>
                candidate !== current &&
                !candidate.ancestors.includes(current.node) &&
                !current.ancestors.includes(candidate.node),
        );
        const next = closestInDirection(unrelated, current.bounds, direction);
        if (!next) {
            return false;
        }
        this.focusNode(next.node);
        return true;
    }

    activateFocused(): boolean {
        const current = this.focusedCandidate();
        if (!current) {
            return false;
        }
        return this.activate(current.node);
    }

    blurFocus(): void {
        this.hide(this.focusedBounds() ?? this.resumeAt);
    }

    clearFocus(): void {
        this.hide(null);
    }

    enterFocusAfterLayout(near: Bounds | null): void {
        this.focused = null;
        this.pendingEntry = { near };
    }

    /** Hides focus for a pointer press, resuming from the press point. */
    hideForPointer(point: Point): void {
        this.hide({ x1: point.x, y1: point.y, x2: point.x, y2: point.y });
    }

    /**
     * Called by the renderer for every node that unmounts. Focus on it moves
     * to whatever sits nearest once the replacement is laid out.
     */
    forget(node: UiNode): void {
        if (node !== this.focused) {
            return;
        }
        const lostAt = regionBounds(node);
        this.focused = null;
        this.resumeAt = lostAt;
        this.pendingEntry = { near: lostAt };
    }

    /**
     * Called by the renderer once a render has laid the tree out, since only
     * then are the targets and their positions known.
     */
    afterLayout(): void {
        this.candidateCache = null;
        let entry = this.pendingEntry;
        if (!entry && this.focused && !this.focusedCandidate()) {
            // Still mounted but no longer focusable or visible, such as a
            // scroll arrow that disables itself at the end
            entry = { near: regionBounds(this.focused) };
        }
        this.pendingEntry = null;
        if (entry) {
            this.focused = null;
            this.enterFocus(entry.near);
        }
    }

    private hide(resumeAt: Bounds | null): void {
        this.focused = null;
        this.pendingEntry = null;
        this.resumeAt = resumeAt;
    }

    private focusNode(node: UiNode): void {
        this.focused = node;
        this.pendingEntry = null;
    }

    /**
     * The focused node as a candidate, or null when it can't take focus or
     * can't be seen anymore. Focus scrolled out of a clip counts as not
     * visible, so the action key never presses something the player can't see.
     */
    private focusedCandidate(): FocusCandidate | null {
        const focused = this.focused;
        if (!focused) {
            return null;
        }
        return (
            this.candidates().find((candidate) => candidate.node === focused) ??
            null
        );
    }

    private candidates(): FocusCandidate[] {
        if (!this.candidateCache) {
            this.candidateCache = this.collectCandidates();
        }
        return this.candidateCache;
    }
}

function regionBounds(node: UiNode): Bounds | null {
    const region = node.layout?.region;
    if (!region) {
        return null;
    }
    return boundsFromRectangle(region);
}

import { type Bounds } from "../../common/bounds.ts";

/**
 * A single focusable target that keyboard navigation can move to.
 *
 * Focus navigation works purely on bounds, so anything that can report a
 * rectangle and react to gaining or losing focus can act as a node. Keyboard
 * focus is meant to reach both UI elements and in-world items, mirroring how
 * the cursor can tap either one. A bounds-only contract lets one directional
 * navigation serve both, with no implementation per kind of target.
 */
export interface FocusNode {
    bounds: Bounds;
    onFocus(): void;
    onFocusLost(): void;
    onFocusTapActivate(node: FocusNode): boolean;
}

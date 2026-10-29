import { type Point } from "../../../common/point.ts";
import { type InputAction } from "../../../input/inputAction.ts";
import { type GroundTile } from "../../map/tile.ts";
import type { ComponentDescriptor } from "../../../ui/declarative/ui.ts";
import { RenderScope } from "../../../rendering/renderScope.ts";
import type { WorldSelection } from "../selection/selectedWorldItem.ts";
import { FocusDomain } from "../focus/focusDomain.ts";
// Full `import type` statements: these two modules import back into this one
// (changer -> history -> root state -> this), so the edges must vanish at
// runtime or loading this module first hits the cycle before the class exists.
import type { InteractionStateChanger } from "./interactionStateChanger.ts";
import type { StateContext } from "./stateContext.ts";

/**
 * Interaction is built up as a simple state machine. Each state can via the
 * InteractionStateChanger trigger a change to another state. Then the currently
 * active state is resposible for handling taps, input and drawing.
 */
export abstract class InteractionState {
    private _context: StateContext | undefined;
    public stateId?: number; // Unique identifier assigned by InteractionHandler

    /**
     * Get the name of this interaction state
     *
     * @readonly
     */
    get stateName(): string {
        return "State";
    }

    /**
     * The state context for this state, contains access to the world and other
     * components useful to a state.
     * Set after the constructor has run, but before the first onActive call.
     */
    get context(): StateContext {
        if (!this._context) {
            throw Error("State context is not set");
        }
        return this._context;
    }

    /**
     * Sets the context for this state
     */
    set context(v: StateContext) {
        this._context = v;
    }

    /**
     * Returns if this state is considered a modal state.
     * if true it will be given a scrim and taps that are not
     * handled will pop the state
     */
    get isModal(): boolean {
        return false;
    }

    getView(): ComponentDescriptor | null {
        return null;
    }

    /**
     * Where keyboard focus can be while this state is active, in the order the
     * cycle key visits them. The first is where the keys go when the state
     * opens. States about something in the world offer the world first.
     */
    get focusDomains(): readonly FocusDomain[] {
        return [FocusDomain.Hud];
    }

    /**
     * What this state has picked in the world, read every frame. It is the
     * focus while the keys are on the world, and the interaction handler draws
     * it as the world cursor, so a state reports its selection here instead of
     * drawing a frame of its own.
     *
     * States whose picks span several tiles with their own visuals, like
     * placing a line of buildings, report only the tile the cursor is on.
     */
    getWorldSelection(): WorldSelection | null {
        return null;
    }

    /**
     * A tile in the world was pressed, by a tap the HUD did not take or by the
     * keys moving or activating focus in the world. Presses the state does not
     * take select what is on the tile.
     * @param position the tile that was pressed
     * @param ground the ground there, null where there is no land
     * @returns whether the state took the press
     */
    onTilePress(_position: Point, _ground: GroundTile | null): boolean {
        return false;
    }

    onTapPan(_movement: Point, _position: Point, _startPosition: Point): void {}

    /**
     * Called when this state becomes the active state, either by being popped
     * back to, or the first time it becomes active. Will be called multiple
     * times during its life if its shown or hidden
     */
    onActive(): void {}

    /**
     * Called when this state becomes inactive. Either from another state
     * becomming active on to or from being removed.
     */
    onInactive(): void {}

    /**
     * Update method called consistently on each update
     * @param tick
     */
    onUpdate(_tick: number): void {}

    /**
     * Called when its time to render/draw anything this state wants to in the
     * world. The view returned by getView and the world selection are drawn by
     * the interaction handler, not here.
     *
     * Note: this method has a varying frequency of updates. Any logic that
     * needs a consistent update cycle should be called in onUpdate
     * @param context Render context with access to camera and drawing methods
     */
    onDraw(_context: RenderScope): void {}

    /**
     * An input event has occured, like the directional keys or action key was
     * pressed. Runs before any generic handling of the input, so a state can
     * claim a key for itself.
     * @param input the event that occured
     * @param stateChanger InteractionStateChanger that can be used to change
     * to a different state
     * @returns if the input has been handled or not
     */
    onInput(
        _input: InputAction,
        _stateChanger: InteractionStateChanger,
    ): boolean {
        return false;
    }
}

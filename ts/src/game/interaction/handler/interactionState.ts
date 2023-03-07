import { sprites2 } from "../../../asset/sprite";
import { Point } from "../../../common/point";
import { allSides } from "../../../common/sides";
import { InputAction } from "../../../input/inputAction";
import { RenderContext } from "../../../rendering/renderContext";
import { UIEvent } from "../../../ui/event/uiEvent";
import { FocusState } from "../../../ui/focus/focusState";
import { UIView } from "../../../ui/uiView";
import { GroundTile } from "../../world/tile/ground";
import { InteractionStateChanger } from "./interactionStateChanger";
import { StateContext } from "./stateContext";

/**
 * Interaction is built up as a simple state machine. Each state can via the
 * InteractionStateChanger trigger a change to another state. Then the currently
 * active state is resposible for handling taps, input and drawing.
 */
export abstract class InteractionState {
    private _context: StateContext | undefined;
    private _view: UIView | null = null;

    /**
     * Retrieve the currently set root view of the this state
     */
    public get view(): UIView | null {
        return this._view;
    }
    /**
     * Sets the view of this state, will be used for checking UIEvent's and
     * drawn automatically
     */
    protected set view(value: UIView | null) {
        this._view = value;
    }

    /**
     * The state context for this state, contains access to the world and other
     * components useful to a state.
     * Set after the constructor has run, but before the first onActive call.
     */
    public get context(): StateContext {
        if (!this._context) {
            throw Error("State context is not set");
        }
        return this._context;
    }

    /**
     * Sets the context for this state
     */
    public set context(v: StateContext) {
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

    /**
     * Dispatch a UI event to the currently set view
     * @param event the event to dispatch to the view
     * @returns if the event was handled or not
     */
    dispatchUIEvent(event: UIEvent): boolean {
        if (this._view) {
            const handled = this._view.dispatchUIEvent(event);
            return handled;
        } else {
            return false;
        }
    }

    /**
     * A tap has occured on a tile in the world. Will not be called if onTap has
     * returned true indicating that is has handled it. (To avoid clicks on UI)
     * elements also causing a selection of a tile behind.
     * @param tile the tile that was tapped
     */
    onTileTap(tile: GroundTile): boolean {
        return false;
    }

    /**
     * A tap has occured on screen and it was not handled by the view
     * @param screenPosition the position of the tap
     * @returns if the tap was handled or not
     */
    onTap(screenPosition: Point, worldPosition: Point): boolean {
        return false;
    }

    onTapPan(movement: Point, position: Point, startPosition: Point): void {}

    /**
     * Called when this state becomes the active state, either by being popped
     * back to, or the first time it becomes active. Will be called multiple
     * times during its life if its shown or hidden
     */
    onActive(): void {}

    /**
     * Called when this state becomes inactive. Either from another state
     * becomming active on to or from being removed.
     * Overriding implementions should call super.onInactive to ensure that
     * the view is properly disposed
     */
    onInactive(): void {
        this._view?.dispose();
    }

    /**
     * Update method called consistently on each update
     * @param tick
     */
    onUpdate(tick: number): void {}

    /**
     * Called when its time to render/draw anything this state wants to.
     * Make sure to call `super.OnDraw(...)` if this is overriden to show any
     * views set.
     *
     * Note: this method has a varying frequency of updates. Any logic that
     * needs a consistent update cycle should be called in onUpdate
     * @param context Render context with access to camera and drawing methods
     */
    onDraw(context: RenderContext): void {
        if (this._view) {
            //const start = performance.now();
            if (this._view.isDirty) {
                this._view.layout(context, {
                    width: context.width,
                    height: context.height,
                });
            }
            this._view.updateTransform();
            this._view.draw(context);
            this.drawFocus(context, this._view.focusState);
            //const end = performance.now();
            //console.log(`build state draw: ${end - start}`);
        }
    }

    /**
     * An input event has occured, like the directional keys or action key was
     * pressed
     * @param input the event that occured
     * @param stateChanger InteractionStateChanger that can be used to change
     * to a different state
     * @returns if the tap has been handled or not
     */
    onInput(
        input: InputAction,
        stateChanger: InteractionStateChanger
    ): boolean {
        return false;
    }

    private drawFocus(context: RenderContext, focusState: FocusState) {
        const currentFocus = focusState.currentFocus;
        if (!!currentFocus && this._context) {
            const postition = currentFocus.screenPosition;
            const size = currentFocus.measuredSize;
            if (!!size) {
                const sizeVariation = 2 - (this._context.gameTime.tick % 2) * 4;
                context.drawNinePatchSprite({
                    sprite: sprites2.cursor,
                    height: size.height + sizeVariation,
                    width: size.width + sizeVariation,
                    scale: 1.0,
                    sides: allSides(12.0),
                    x: postition.x + (this._context.gameTime.tick % 2) * 2,
                    y: postition.y + (this._context.gameTime.tick % 2) * 2,
                });
            }
        }
    }
}

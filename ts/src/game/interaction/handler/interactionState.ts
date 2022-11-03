import { Point } from "../../../common/point";
import { InputEvent } from "../../../input/input";
import { RenderContext } from "../../../rendering/renderContext";
import { UIEvent } from "../../../ui/event/uiEvent";
import { UIView } from "../../../ui/uiView";
import { GroundTile } from "../../entity/ground";
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

    public get view(): UIView | null {
        return this._view;
    }

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
     * Returns if this state is considered a modal state, if true it will be given
     * a scrim and taps that are not handled will pop the state
     */
    get isModal(): boolean {
        return false;
    }

    /**
     *
     * @param event
     * @returns
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
     * Called when its time to render/draw anything this state wants to
     * @param context The render context with access to camera and drawing methods
     */
    onDraw(context: RenderContext): void {
        if (this._view) {
            const start = performance.now();
            if (this._view.isDirty) {
                this._view.layout(context, {
                    width: context.width,
                    height: context.height,
                });
            }
            this._view.updateTransform();
            this._view.draw(context);
            const end = performance.now();
            console.log(`build state draw: ${end - start}`);
        }
    }

    /**
     * An input event has occured, like the directional keys or action key was
     * pressed
     * @param input the event that occured
     * @param stateChanger The InteractionStateChanger that can be used to change
     * to a different state
     * @returns if the tap has been handled or not
     */
    abstract onInput(
        input: InputEvent,
        stateChanger: InteractionStateChanger
    ): boolean;
}

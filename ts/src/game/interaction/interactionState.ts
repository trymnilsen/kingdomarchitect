import { Point } from "../../common/point";
import { InputEvent } from "../../input/input";
import { RenderContext } from "../../rendering/renderContext";
import { GroundTile } from "../entity/ground";
import { InteractionStateChanger } from "./interactionStateChanger";

/**
 * Interaction is built up as a simple state machine. Each state can via the
 * InteractionStateChanger trigger a change to another state. Then the currently
 * active state is resposible for handling taps, input and drawing.
 */
export abstract class InteractionState {
    /**
     * Returns if this state is considered a modal state, if true it will be given
     * a scrim and taps that are not handled will pop the state
     */
    get isModal(): boolean {
        return false;
    }

    /**
     * A tap has occured at the given screen position. The coordinates are
     * relative to the browser client viewport, not the entire computer screen.
     * @param screenPosition The coordinate for the tap
     * @param stateChanger The InteractionStateChanger that can be used to change
     * to a different state
     * @returns if the tap has been handled or not
     */
    abstract onTap(
        screenPosition: Point,
        stateChanger: InteractionStateChanger
    ): boolean;
    /**
     * A tap has occured on a tile in the world. Will not be called if onTap has
     * returned true indicating that is has handled it. (To avoid clicks on UI)
     * elements also causing a selection of a tile behind.
     * @param tile the tile that was tapped
     * @param stateChanger The InteractionStateChanger that can be used to change
     * to a different state
     */
    abstract onTileTap(
        tile: GroundTile,
        stateChanger: InteractionStateChanger
    ): void;
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

    /**
     * Called when its time to render/draw anything this state wants to
     * @param context The render context with access to camera and drawing methods
     */
    abstract onDraw(context: RenderContext): void;

    /**
     * Called when this state becomes the active state, either by being popped
     * back to, or the first time it becomes active.
     */
    onActive(): void {}
    /**
     * Called when this state becomes inactive. Either from another state
     * becomming active on to or from being removed.
     */
    onInactive(): void {}
}

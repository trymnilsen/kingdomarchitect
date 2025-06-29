import { sprites2 } from "../../../module/asset/sprite.js";
import { Point } from "../../../common/point.js";
import { allSides } from "../../../common/sides.js";
import {
    InputAction,
    InputActionType,
    getDirectionFromInputType,
} from "../../../module/input/inputAction.js";
import { RenderScope } from "../../../rendering/renderScope.js";
import { UIEvent } from "../../../module/ui/event/uiEvent.js";
import { FocusGroup } from "../../../module/ui/focus/focusGroup.js";
import { FocusState } from "../../../module/ui/focus/focusState.js";
import { UIView } from "../../../module/ui/uiView.js";
import { GroundTile } from "../../../module/map/tile.js";
import { InteractionStateChanger } from "./interactionStateChanger.js";
import { StateContext } from "./stateContext.js";
import type { ComponentDescriptor } from "../../../module/ui/declarative/ui.js";

/**
 * Interaction is built up as a simple state machine. Each state can via the
 * InteractionStateChanger trigger a change to another state. Then the currently
 * active state is resposible for handling taps, input and drawing.
 */
export abstract class InteractionState {
    private _context: StateContext | undefined;
    private _cachedFocusGroups: FocusGroup[] = [];
    private _currentFocusGroupIndex = 0;

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
     * Retrieve the focus groups for this interaction state,
     * defaults to return the root view if any. Implemented as a
     * method and not a property to allow easy overriding.
     */
    getFocusGroups(): FocusGroup[] {
        /*
        if (this._view) {
            return [this._view];
        } else {
         */
        return [];
        //}
    }

    /**
     * Dispatch a UI event to the currently set view
     *
     * This method is part of the old imperative UI system and is now deprecated
     * in favor of the new declarative UI system. The InteractionHandler now
     * dispatches events directly to the UiRenderer, bypassing InteractionState.
     *
     * @param event the event to dispatch to the view
     * @returns if the event was handled or not
     */
    dispatchUIEvent(event: UIEvent): boolean {
        // Old imperative UI system - commented out as we move to declarative UI
        // The declarative UI system handles events directly in InteractionHandler
        console.log(
            "UI Event received in InteractionState (deprecated): ",
            event,
        );
        return false;
    }

    /**
     * A tap has occured on a tile in the world. Will not be called if onTap has
     * returned true indicating that is has handled it. (To avoid clicks on UI)
     * elements also causing a selection of a tile behind.
     * @param tile the tile that was tapped
     */
    onTileTap(_tile: GroundTile): boolean {
        return false;
    }

    /**
     * A tap has occured on screen and it was not handled by the view
     * @param screenPosition the position of the tap
     * @returns if the tap was handled or not
     */
    onTap(_screenPosition: Point, _worldPosition: Point): boolean {
        return false;
    }

    onTapPan(_movement: Point, _position: Point, _startPosition: Point): void {}

    /**
     * Called when this state becomes the active state, either by being popped
     * back to, or the first time it becomes active. Will be called multiple
     * times during its life if its shown or hidden
     */
    onActive(): void {}

    onFocusChanged(_focusGroup: FocusGroup) {}

    /**
     * Called when this state becomes inactive. Either from another state
     * becomming active on to or from being removed.
     * Overriding implementions should call super.onInactive to ensure that
     * the view is properly disposed
     */
    onInactive(): void {
        //this._view?.dispose();
    }

    /**
     * Update method called consistently on each update
     * @param tick
     */
    onUpdate(_tick: number): void {}

    /**
     * Called when its time to render/draw anything this state wants to.
     * Make sure to call `super.OnDraw(...)` if this is overriden to show any
     * views set.
     *
     * Note: this method has a varying frequency of updates. Any logic that
     * needs a consistent update cycle should be called in onUpdate
     * @param context Render context with access to camera and drawing methods
     */
    onDraw(_context: RenderScope): void {}

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
        _stateChanger: InteractionStateChanger,
    ): boolean {
        const view = false;
        const direction = getDirectionFromInputType(input.action);
        if (!view) {
            return false;
        }

        let consumedInput = false;
        if (direction) {
            const focusGroups = this._cachedFocusGroups;
            const currentFocusIndex = this._currentFocusGroupIndex;
            const currentFocusGroup = focusGroups[currentFocusIndex];
            const currentFocusBounds = currentFocusGroup.getFocusBounds();

            for (let i = currentFocusIndex; i < focusGroups.length; i++) {
                const focusGroup = focusGroups[i];
                const focusTaken = focusGroup.moveFocus(
                    direction,
                    currentFocusBounds,
                );

                if (focusTaken) {
                    this._currentFocusGroupIndex = i;
                    consumedInput = true;
                    break;
                }
            }
        }

        if (input.action == InputActionType.ACTION_PRESS) {
            const currentFocusGroup = this.getCurrentFocusGroup();
            if (currentFocusGroup) {
                currentFocusGroup.onFocusActionInput();
            }
        }

        return consumedInput;
    }

    private drawFocus(context: RenderScope) {
        const currentFocusGroup = this.getCurrentFocusGroup();
        if (!currentFocusGroup) {
            return;
        }

        const currentFocus = currentFocusGroup.getFocusBounds();
        if (!!currentFocus && this._context) {
            const width = currentFocus.x2 - currentFocus.x1;
            const height = currentFocus.y2 - currentFocus.y1;

            const sizeVariation = 2 - (this._context.gameTime.tick % 2) * 4;
            context.drawNinePatchSprite({
                sprite: sprites2.cursor,
                height: height + sizeVariation,
                width: width + sizeVariation,
                scale: 1.0,
                sides: allSides(12.0),
                x: currentFocus.x1 + (this._context.gameTime.tick % 2) * 2,
                y: currentFocus.y1 + (this._context.gameTime.tick % 2) * 2,
            });
        }
    }

    private getCurrentFocusGroup(): FocusGroup | null {
        const index = this._currentFocusGroupIndex;
        const focusGroups = this._cachedFocusGroups.length;

        if (focusGroups === 0 || focusGroups <= index || index < 0) {
            return null;
        }

        return this._cachedFocusGroups[index];
    }
}

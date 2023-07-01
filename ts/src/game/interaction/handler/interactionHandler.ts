import { AssetLoader } from "../../../asset/loader/assetLoader.js";
import { Point } from "../../../common/point.js";
import { GameTime } from "../../../common/time.js";
import { InputAction, InputActionType } from "../../../input/inputAction.js";
import { OnTapEndEvent } from "../../../input/touchInput.js";
import { Camera } from "../../../rendering/camera.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { World } from "../../world/world.js";
import { CommitableInteractionStateChanger } from "./interactionStateChanger.js";
import { InteractionStateHistory } from "./interactionStateHistory.js";
import { StateContext } from "./stateContext.js";

/**
 * The interactionHandler recieves input taps and forward them to the currently
 * active state. It also handles the transition and history of states.
 */
export class InteractionHandler {
    private camera: Camera;
    private world: World;
    private interactionStateChanger: CommitableInteractionStateChanger;
    private history: InteractionStateHistory;

    constructor(
        world: World,
        camera: Camera,
        assets: AssetLoader,
        time: GameTime
    ) {
        this.interactionStateChanger = new CommitableInteractionStateChanger();
        this.world = world;
        this.camera = camera;
        const stateContext: StateContext = {
            world: this.world,
            assets: assets,
            stateChanger: this.interactionStateChanger,
            gameTime: time,
        };
        this.history = new InteractionStateHistory(stateContext);
    }

    onTapDown(screenPoint: Point): boolean {
        const state = this.history.state;
        const stateHandledTap = state.dispatchUIEvent({
            type: "tapStart",
            position: screenPoint,
        });
        //If the tap was not handled but the state is a modal it is still
        //considered handled by the handler. so that tapping the faded overlay
        //pops the state
        if (!stateHandledTap && state.isModal) {
            return true;
        } else {
            return stateHandledTap;
        }
    }

    onTapUp(tapUpEvent: OnTapEndEvent): void {
        const currentState = this.history.state;
        const screenPoint = tapUpEvent.position;

        //We dispatch two events as they are handled differently when it comes
        //to applicability. `tap` requires both position and startposition to
        //be withing the bounds. `tapUp` requires only startposition. A view
        //should also be able to handle one without affecting the other
        currentState.dispatchUIEvent({
            type: "tapUp",
            position: screenPoint,
            startPosition: tapUpEvent.startPosition,
        });

        let onTapResult = currentState.dispatchUIEvent({
            type: "tap",
            position: screenPoint,
            startPosition: tapUpEvent.startPosition,
        });

        const worldPosition = this.camera.screenToWorld(screenPoint);
        // Check if the tap is handled by the state if its ignored by the view
        if (!onTapResult) {
            onTapResult = currentState.onTap(screenPoint, worldPosition);
        }
        // If the tap was not handled in the ui or by the state itself
        // We will now check for either of the following:

        // - The state is modal in which case this is considered a tap on the
        // scrim and we should take the tap as a dismis
        // - The state should check if there is a tile at the world position
        // of the tap
        if (!onTapResult && !tapUpEvent.wasDragging) {
            if (currentState.isModal) {
                // if the tap was not handled and the current route is a modal
                // route we pop the state
                console.log("Tap was not handled by modal route, popping");
                this.history.pop();
                // Return to stop handling the tap more
                return;
            }

            const tilePosition =
                this.camera.worldSpaceToTileSpace(worldPosition);

            // Check if a tile was clicked at this position
            const tile = this.world.ground.getTile(tilePosition);
            if (tile) {
                const tileTapHandled = currentState.onTileTap(tile);

                // If the tap is not handled we treat it as a clear
                if (!tileTapHandled) {
                    this.interactionStateChanger.clear();
                }
            } else {
                // Tap was not handled and we did not tap a tile
                this.interactionStateChanger.clear();
            }
        }

        this.interactionStateChanger.apply(this.history);
    }

    onTapPan(movement: Point, position: Point, startPosition: Point): void {
        this.history.state.onTapPan(movement, position, startPosition);
    }

    onInput(inputAction: InputAction) {
        const inputHandled = this.history.state.onInput(
            inputAction,
            this.interactionStateChanger
        );

        if (
            !inputHandled &&
            inputAction.action == InputActionType.BACK_PRESS &&
            !this.interactionStateChanger.hasOperations
        ) {
            this.interactionStateChanger.pop(undefined);
        }
        this.interactionStateChanger.apply(this.history);
    }

    onUpdate(tick: number) {
        this.history.state.onUpdate(tick);
    }

    onDraw(renderContext: RenderContext) {
        if (this.history.state.isModal) {
            renderContext.drawScreenSpaceRectangle({
                x: 0,
                y: 0,
                width: renderContext.width,
                height: renderContext.height,
                fill: "rgba(20, 20, 20, 0.8)",
            });
        }
        this.history.state.onDraw(renderContext);
    }
}

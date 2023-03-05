import { AssetLoader } from "../../../asset/loader/assetLoader";
import { Point } from "../../../common/point";
import { GameTime } from "../../../common/time";
import { InputAction, InputActionType } from "../../../input/inputAction";
import { Camera } from "../../../rendering/camera";
import { RenderContext } from "../../../rendering/renderContext";
import { World } from "../../world/world";
import { CommitableInteractionStateChanger } from "./interactionStateChanger";
import { InteractionStateHistory } from "./interactionStateHistory";
import { StateContext } from "./stateContext";

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

    onTapUp(screenPoint: Point) {
        this.history.state.dispatchUIEvent({
            type: "tapEnd",
            position: screenPoint,
        });
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

    onTap(screenPoint: Point): void {
        const currentState = this.history.state;
        let onTapResult = currentState.dispatchUIEvent({
            type: "tap",
            position: screenPoint,
        });

        const worldPosition = this.camera.screenToWorld(screenPoint);
        // Check if the tap is handled by the state
        if (!onTapResult) {
            onTapResult = currentState.onTap(screenPoint, worldPosition);
        }
        // If the tap was not handled in the ui check if it will be handled
        // by the state itself
        if (!onTapResult) {
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

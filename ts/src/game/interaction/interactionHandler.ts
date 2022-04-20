import { Point } from "../../common/point";
import { Camera } from "../../rendering/camera";
import { RenderContext } from "../../rendering/renderContext";
import { World } from "../world";
import { CommitableInteractionStateChanger } from "./interactionStateChanger";
import { InteractionStateHistory } from "./interactionStateHistory";

/**
 * The interactionHandler recieves input taps and forward them to the currently
 * active state. It also handles the transition and history of states.
 */
export class InteractionHandler {
    private camera: Camera;
    private world: World;
    private history: InteractionStateHistory;

    constructor(world: World, camera: Camera) {
        this.world = world;
        this.camera = camera;
        this.history = new InteractionStateHistory();
    }

    tap(screenPoint: Point): void {
        const stateChanger = new CommitableInteractionStateChanger();
        const onTapResult = this.history.state.onTap(screenPoint, stateChanger);

        //If the tap was not handled check if it will be handled in tilespace
        if (!onTapResult) {
            if (this.history.state.isModal) {
                // if the tap was not handled and the current route is a modal
                // route we pop the state
                console.log("Tap was not handled by modal route, popping");
                this.history.pop();
                // Return to stop handling the tap more
                return;
            }

            // If we do not handle the tap but return state changes, we log it
            // for our own sanity in the future
            if (stateChanger.hasOperations) {
                console.warn("Tap was not handled but returned state change");
            }

            // Get the transformed position of the click
            const worldPosition = this.camera.screenToWorld(screenPoint);
            const tilePosition =
                this.camera.worldSpaceToTileSpace(worldPosition);

            // Check if a tile was clicked at this position
            const tile = this.world.ground.getTile(tilePosition);
            if (tile) {
                this.history.state.onTileTap(tile, stateChanger);
            }
        }

        // Apply the state changes from tapping to the state
        stateChanger.apply(this.history);
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

    private clearInteractionState() {
        this.history.clear();
    }
}

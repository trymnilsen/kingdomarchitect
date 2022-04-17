import { Point } from "../../common/point";
import { Camera } from "../../rendering/camera";
import { RenderContext } from "../../rendering/renderContext";
import { World } from "../world";
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
        const onTapResult = this.history.state.onTap(screenPoint, this.history);
        if (onTapResult) {
            // The tap in screenspace was consumed by the state, no need for
            // further processing
            return;
        }

        if (this.history.state.isModal) {
            this.history.pop();
        } else {
            const worldPosition = this.camera.screenToWorld(screenPoint);
            const tilePosition =
                this.camera.worldSpaceToTileSpace(worldPosition);

            const tile = this.world.ground.getTile(tilePosition);
            if (tile) {
                this.history.state.onTileTap(tile, this.history);
            } else {
                // No tap result was handled and no tile was present at tap.
                // as of now this means that nothing in the map was pressed
                this.clearInteractionState();
            }
        }
    }

    onDraw(renderContext: RenderContext) {
        if (this.history.state.isModal) {
            renderContext.drawScreenSpaceRectangle({
                x: 0,
                y: 0,
                width: renderContext.width,
                height: renderContext.height,
                fill: "rgba(40, 40, 40, 0.8)",
            });
        }
        this.history.state.onDraw(renderContext);
    }

    private clearInteractionState() {
        this.history.clear();
    }
}

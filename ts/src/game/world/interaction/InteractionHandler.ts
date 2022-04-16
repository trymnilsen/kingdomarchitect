import { Point } from "../../../common/point";
import { Camera } from "../../../rendering/camera";
import { RenderContext } from "../../../rendering/renderContext";
import { cursorVisual } from "../../../visual/cursor/cursorVisual";
import { World } from "../world";

export class InteractionHandler {
    private world: World;
    private camera: Camera;
    private cursorPosition: Point | null = null;
    private currentInteractionState: InteractionState;
    private actions: Action[] = [];
    constructor(world: World, camera: Camera) {
        this.world = world;
        this.camera = camera;
        this.currentInteractionState = new BaseInteractionState();
    }

    tap(worldPoint: Point): void {
        const tilePosition = this.camera.worldSpaceToTileSpace(worldPoint);
        const actions =
            this.currentInteractionState.selectionChanged(tilePosition);
        if (actions.length > 0) {
            this.cursorPosition =
                this.camera.tileSpaceToWorldSpace(tilePosition);
            this.actions = actions;
        } else {
            this.cursorPosition = null;
            this.resetInteractionState();
        }
    }

    onDraw(renderContext: RenderContext) {
        if (this.cursorPosition) {
            cursorVisual(this.cursorPosition, renderContext);
        }
        for (let i = 0; i < this.actions.length; i++) {
            const action = this.actions[i];
            
        }
    }

    private resetInteractionState() {
        this.currentInteractionState = new BaseInteractionState();
    }
}

interface Action {
    name: string;
}

interface InteractionState {
    selectionChanged(position: Point): Action[];
}

class BaseInteractionState implements InteractionState {
    selectionChanged(position: Point): Action[] {
        throw new Error("Method not implemented.");
    }
}

// Draw Actions
// Select move action -> Interaction state
// select tile again confirm

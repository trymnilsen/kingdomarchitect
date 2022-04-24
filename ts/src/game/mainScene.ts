import { Point } from "../common/point";
import { InputAction } from "../input/inputAction";
import { Camera } from "../rendering/camera";
import { RenderContext } from "../rendering/renderContext";
import { Scene } from "../scene/scene";
import { InteractionHandler } from "./interaction/handler/interactionHandler";
import { World } from "./world";

export class MainScene implements Scene {
    private world: World;
    private interactionHandler: InteractionHandler;

    constructor(camera: Camera) {
        this.world = new World();
        this.world.invalidateWorld();
        this.interactionHandler = new InteractionHandler(this.world, camera);
    }

    tick(tick: number): void {
        this.world.tick(tick);
    }

    tap(worldPoint: Point): void {
        this.interactionHandler.tap(worldPoint);
    }

    input(action: InputAction): void {}

    drawScene(context: RenderContext): void {
        this.world.onDraw(context);
        this.interactionHandler.onDraw(context);
    }
}

import { Point } from "../common/point";
import { InputAction } from "../input/inputAction";
import { Camera } from "../rendering/camera";
import { RenderContext } from "../rendering/renderContext";
import { InteractionHandler } from "./interaction/handler/interactionHandler";
import { spawnRoutines } from "./routine/spawnRoutines";
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
        for (const routine of spawnRoutines) {
            routine(tick, this.world);
        }
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

export interface Scene {
    drawScene(context: RenderContext): void;
    input(action: InputAction): void;
    tap(screenPoint: Point): void;
    tick(tick: number): void;
}

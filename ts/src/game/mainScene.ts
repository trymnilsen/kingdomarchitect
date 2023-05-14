import { AssetLoader } from "../asset/loader/assetLoader";
import { Point } from "../common/point";
import { GameTime } from "../common/time";
import { InputAction } from "../input/inputAction";
import { OnTapEndEvent } from "../input/touchInput";
import { Camera } from "../rendering/camera";
import { RenderContext } from "../rendering/renderContext";
import { InteractionHandler } from "./interaction/handler/interactionHandler";
import { World } from "./world/world";

export class MainScene implements Scene {
    private world: World;
    private interactionHandler: InteractionHandler;

    constructor(camera: Camera, assetsLoader: AssetLoader, gameTime: GameTime) {
        this.world = new World();
        //this.world.invalidateWorld();
        this.interactionHandler = new InteractionHandler(
            this.world,
            camera,
            assetsLoader,
            gameTime
        );
    }

    tick(tick: number): void {
        /*for (const routine of spawnRoutines) {
            //routine(tick, this.world);
        }*/
        this.world.tick(tick);
        this.interactionHandler.onUpdate(tick);
    }

    onTapUp(tapEndEvent: OnTapEndEvent): void {
        this.interactionHandler.onTapUp(tapEndEvent);
    }

    onTapDown(screenPoint: any): boolean {
        return this.interactionHandler.onTapDown(screenPoint);
    }

    onTapPan(movement: Point, position: Point, startPoint: Point): void {
        this.interactionHandler.onTapPan(movement, position, startPoint);
    }

    input(action: InputAction): void {
        this.interactionHandler.onInput(action);
    }

    drawScene(context: RenderContext): void {
        this.world.onDraw(context);
        this.interactionHandler.onDraw(context);
    }
}

export interface Scene {
    drawScene(context: RenderContext): void;
    input(action: InputAction): void;
    onTapDown(screenPoint: Point): boolean;
    onTapUp(tapEndEvent: OnTapEndEvent): void;
    onTapPan(movement: Point, position: Point, startPoint: Point): void;
    tick(tick: number): void;
}

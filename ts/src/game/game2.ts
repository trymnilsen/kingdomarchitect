import { AssetLoader } from "../asset/loader/assetLoader.js";
import { EcsWorld } from "../ecs/ecsWorld.js";
import { Input } from "../input/input.js";
import { TouchInput } from "../input/touchInput.js";
import { InteractionHandler } from "./interaction/handler/interactionHandler.js";

export class Game2 {
    private world: EcsWorld;
    private assetLoader: AssetLoader;
    private input: Input;
    private touchInput: TouchInput;
    private interactionHandler: InteractionHandler;

    constructor(domElementWrapperSelector: string) {
        // Get the canvas
        const canvasElement: HTMLCanvasElement | null = document.querySelector(
            `#${domElementWrapperSelector}`,
        );

        if (canvasElement == null) {
            throw new Error("Canvas element not found");
        }

        // Input
        this.input = new Input();
        this.touchInput = new TouchInput(canvasElement);

        this.assetLoader = new AssetLoader();
        this.world = new EcsWorld();
        // UI states handling
        this.interactionHandler = new InteractionHandler(
            this.world,
            this.renderer.camera,
            this.assetLoader,
            this.gameTime,
            () => {
                this.visibilityMap.useVisibility =
                    !this.visibilityMap.useVisibility;
                this.updateVisibilityMap();
                this.render(DrawMode.Gesture);
            },
        );
    }

    async bootstrap(): Promise<void> {
        await this.assetLoader.load();

        this.touchInput.onTapDown = (position: Point) => {
            const tapResult = this.interactionHandler.onTapDown(position);
            this.render(DrawMode.Gesture);
            return tapResult;
        };

        this.touchInput.onPan = (
            movement: Point,
            position: Point,
            startPosition: Point,
            downTapHandled: boolean,
        ) => {
            if (downTapHandled) {
                this.interactionHandler.onTapPan(
                    movement,
                    position,
                    startPosition,
                );
            } else {
                this.renderer.camera.translate(invert(movement));
            }

            this.render(DrawMode.Gesture);
        };

        this.touchInput.onTapEnd = (tapEndEvent) => {
            this.interactionHandler.onTapUp(tapEndEvent);
            this.render(DrawMode.Gesture);
        };

        this.input.onInput.listen((inputEvent) => {
            this.onInput(inputEvent);
        });

        setInterval(this.onTick, 200);

        this.updateVisibilityMap();
        this.render(DrawMode.Gesture);
    }
}

import { changeX, changeY, invert as invert, Point } from "../common/point";
import { TouchInput } from "../input/touchInput";
import { Input, InputEvent } from "../input/input";
import { InputAction } from "../input/inputAction";
import { Renderer } from "../rendering/renderer";
import { MainScene, Scene } from "./mainScene";
import { AssetLoader } from "../asset/loader/assetLoader";
import { TileSize } from "./entity/tile";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private currentScene: Scene;
    private touchInput: TouchInput;
    private assetLoader: AssetLoader;
    private currentTick: number = 0;
    public constructor(domElementWrapperSelector: string) {
        // Get the canvas
        const canvasElement: HTMLCanvasElement | null = document.querySelector(
            `#${domElementWrapperSelector}`
        );

        if (canvasElement == null) {
            throw new Error("Canvas element not found");
        }

        // Input
        this.input = new Input();
        this.touchInput = new TouchInput(canvasElement);

        // Rendering and scenes
        this.assetLoader = new AssetLoader();
        this.renderer = new Renderer(canvasElement, this.assetLoader);
        this.currentScene = new MainScene(this.renderer.camera);
    }

    async bootstrap(): Promise<void> {
        await this.assetLoader.load();

        this.touchInput.onTapDown = (position: Point) => {
            const tapResult = this.currentScene.onTapDown(position);
            this.render();
            return tapResult;
        };

        this.touchInput.onTapUp = (position: Point) => {
            this.currentScene.onTapUp(position);
            this.render();
        };

        this.touchInput.onPan = (movement: Point, position: Point) => {
            this.renderer.camera.translate(invert(movement));
            this.render();
        };

        this.touchInput.onTap = (onTapEvent) => {
            this.currentScene.onTap(onTapEvent);
            this.render();
        };

        this.input.onInput.listen((inputEvent) => {
            this.onInput(inputEvent);
        });

        setInterval(this.onTick, 1000);
        this.render();
    }

    private onTick = () => {
        this.currentTick += 1;
        this.currentScene.tick(this.currentTick);
        this.render();
    };

    private updateCamera(newPosition: Point) {
        this.renderer.camera.position = newPosition;
        this.render();
    }

    private onInput(inputEvent: InputEvent) {
        console.log("Input: ", inputEvent);
        switch (inputEvent.action) {
            case InputAction.ACTION_PRESS:
                this.currentScene.input(inputEvent.action);
                break;
            case InputAction.UP_PRESS:
                this.updateCamera(
                    changeY(this.renderer.camera.position, -TileSize)
                );
                break;
            case InputAction.DOWN_PRESS:
                this.updateCamera(
                    changeY(this.renderer.camera.position, TileSize)
                );
                break;
            case InputAction.LEFT_PRESS:
                this.updateCamera(
                    changeX(this.renderer.camera.position, -TileSize)
                );
                break;
            case InputAction.RIGHT_PRESS:
                this.updateCamera(
                    changeX(this.renderer.camera.position, TileSize)
                );
                break;
        }
        this.render();
    }

    private render() {
        const renderStart = performance.now();
        this.renderer.clearScreen();
        this.currentScene.drawScene(this.renderer.context);
        const renderEnd = performance.now();
        //console.log("⏱render time: ", renderEnd - renderStart);
    }

    public dispose(): any {}
}

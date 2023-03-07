import { AssetLoader } from "../asset/loader/assetLoader";
import { changeX, changeY, invert, Point } from "../common/point";
import { MutableGameTime } from "../common/time";
import { Input, InputEvent } from "../input/input";
import { InputActionType } from "../input/inputAction";
import { TouchInput } from "../input/touchInput";
import { Renderer } from "../rendering/renderer";
import { MainScene, Scene } from "./mainScene";
import { TileSize } from "./world/tile/tile";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private currentScene: Scene;
    private touchInput: TouchInput;
    private assetLoader: AssetLoader;
    private gameTime: MutableGameTime;
    private currentTick: number = 0;
    public constructor(domElementWrapperSelector: string) {
        // Get the canvas
        const canvasElement: HTMLCanvasElement | null = document.querySelector(
            `#${domElementWrapperSelector}`
        );

        if (canvasElement == null) {
            throw new Error("Canvas element not found");
        }
        this.gameTime = new MutableGameTime();

        // Input
        this.input = new Input();
        this.touchInput = new TouchInput(canvasElement);

        // Rendering and scenes
        this.assetLoader = new AssetLoader();
        this.renderer = new Renderer(canvasElement, this.assetLoader);
        this.currentScene = new MainScene(
            this.renderer.camera,
            this.assetLoader,
            this.gameTime
        );
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

        this.touchInput.onPan = (
            movement: Point,
            position: Point,
            startPosition: Point,
            downTapHandled: boolean
        ) => {
            if (downTapHandled) {
                this.currentScene.onTapPan(movement, position, startPosition);
            } else {
                this.renderer.camera.translate(invert(movement));
            }

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
        this.updateCamera({
            x: TileSize * 5,
            y: TileSize * 5,
        });
        this.render();
    }

    private onTick = () => {
        this.currentTick += 1;
        this.gameTime.updateTick(this.currentTick);
        this.currentScene.tick(this.currentTick);
        this.render();
    };

    private updateCamera(newPosition: Point) {
        this.renderer.camera.position = newPosition;
        this.render();
    }

    private onInput(inputEvent: InputEvent) {
        console.log("Input: ", inputEvent);
        if (inputEvent.action.isShifted) {
            switch (inputEvent.action.action) {
                case InputActionType.ACTION_PRESS:
                    this.currentScene.input(inputEvent.action);
                    break;
                case InputActionType.UP_PRESS:
                    this.updateCamera(
                        changeY(this.renderer.camera.position, -TileSize)
                    );
                    break;
                case InputActionType.DOWN_PRESS:
                    this.updateCamera(
                        changeY(this.renderer.camera.position, TileSize)
                    );
                    break;
                case InputActionType.LEFT_PRESS:
                    this.updateCamera(
                        changeX(this.renderer.camera.position, -TileSize)
                    );
                    break;
                case InputActionType.RIGHT_PRESS:
                    this.updateCamera(
                        changeX(this.renderer.camera.position, TileSize)
                    );
                    break;
            }
        } else {
            this.currentScene.input(inputEvent.action);
        }

        this.render();
    }

    private render() {
        //const renderStart = performance.now();
        this.renderer.clearScreen();
        this.currentScene.drawScene(this.renderer.context);
        //const renderEnd = performance.now();
        //console.log("⏱render time: ", renderEnd - renderStart);
    }
}

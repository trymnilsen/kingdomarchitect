import { AssetLoader } from "../asset/loader/assetLoader.js";
import { changeX, changeY, invert, Point } from "../common/point.js";
import { MutableGameTime } from "../common/time.js";
import { Input, InputEvent } from "../input/input.js";
import { InputActionType } from "../input/inputAction.js";
import { TouchInput } from "../input/touchInput.js";
import { Renderer } from "../rendering/renderer.js";
import { InteractionHandler } from "./interaction/handler/interactionHandler.js";
import { Entity } from "./entity/entity.js";
import { createRootEntity } from "./entity/rootEntity.js";
import { TileSize } from "./map/tile.js";
import { RenderVisibilityMap } from "../rendering/renderVisibilityMap.js";
import { VisibilityComponent } from "./component/visibility/visibilityComponent.js";
import { generateMap } from "./map/mapGenerator.js";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private touchInput: TouchInput;
    private assetLoader: AssetLoader;
    private gameTime: MutableGameTime;
    private interactionHandler: InteractionHandler;
    private currentTick = 0;
    private world: Entity;
    private visibilityMap: RenderVisibilityMap = new RenderVisibilityMap();

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

        // Rendering
        this.gameTime = new MutableGameTime();
        this.assetLoader = new AssetLoader();
        this.renderer = new Renderer(
            canvasElement,
            this.assetLoader,
            this.gameTime,
        );

        // World
        this.world = createRootEntity();
        generateMap(this.world);
        // UI states handling
        this.interactionHandler = new InteractionHandler(
            this.world,
            this.renderer.camera,
            this.assetLoader,
            this.gameTime,
        );
    }

    async bootstrap(): Promise<void> {
        await this.assetLoader.load();

        this.touchInput.onTapDown = (position: Point) => {
            const tapResult = this.interactionHandler.onTapDown(position);
            this.render();
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

            this.render();
        };

        this.touchInput.onTapEnd = (tapEndEvent) => {
            this.interactionHandler.onTapUp(tapEndEvent);
            this.render();
        };

        this.input.onInput.listen((inputEvent) => {
            this.onInput(inputEvent);
        });

        setInterval(this.onTick, 1000);

        //this.updateVisibilityMap();
        this.render();
    }

    private onTick = () => {
        //performance.mark("tick-start");
        this.currentTick += 1;
        this.gameTime.updateTick(this.currentTick);
        this.world.onUpdate(this.currentTick);
        this.interactionHandler.onUpdate(this.currentTick);
        //this.updateVisibilityMap();
        this.render();
        //performance.measure("onTick duration", "tick-start");
    };

    private updateCamera(newPosition: Point) {
        this.renderer.camera.position = newPosition;
        this.render();
    }

    private updateVisibilityMap() {
        this.visibilityMap.clear();
        const visibilityComponents =
            this.world.queryComponents(VisibilityComponent);

        for (const visibilityComponent of visibilityComponents) {
            const visiblePoints = visibilityComponent.getVisibility();
            for (const visiblePoint of visiblePoints) {
                this.visibilityMap.setIsVisible(visiblePoint, true);
            }
        }
    }

    private onInput(inputEvent: InputEvent) {
        if (inputEvent.action.isShifted) {
            switch (inputEvent.action.action) {
                case InputActionType.ACTION_PRESS:
                    this.interactionHandler.onInput(inputEvent.action);
                    break;
                case InputActionType.UP_PRESS:
                    this.updateCamera(
                        changeY(this.renderer.camera.position, -TileSize),
                    );
                    break;
                case InputActionType.DOWN_PRESS:
                    this.updateCamera(
                        changeY(this.renderer.camera.position, TileSize),
                    );
                    break;
                case InputActionType.LEFT_PRESS:
                    this.updateCamera(
                        changeX(this.renderer.camera.position, -TileSize),
                    );
                    break;
                case InputActionType.RIGHT_PRESS:
                    this.updateCamera(
                        changeX(this.renderer.camera.position, TileSize),
                    );
                    break;
            }
        } else {
            this.interactionHandler.onInput(inputEvent.action);
        }

        this.render();
    }

    private render() {
        //const renderStart = performance.now();
        this.renderer.clearScreen();
        this.world.onDraw(this.renderer.context, this.visibilityMap);
        this.interactionHandler.onDraw(this.renderer.context);
        this.renderer.renderDeferred();
        //const renderEnd = performance.now();
        //console.log("⏱render time: ", renderEnd - renderStart);
    }
}

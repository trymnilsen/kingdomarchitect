import { AssetLoader } from "../asset/loader/assetLoader.js";
import {
    changeX,
    changeY,
    invert,
    multiplyPoint,
    Point,
} from "../common/point.js";

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
import { firstChildWhere } from "./entity/child/first.js";
import { GameTime } from "../common/time.js";
import { DrawMode } from "../rendering/drawMode.js";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private touchInput: TouchInput;
    private assetLoader: AssetLoader;
    private interactionHandler: InteractionHandler;
    private drawTick = 0;
    private updateTick = 0;
    private world: Entity;
    private gameTime: GameTime = new GameTime();
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
        this.assetLoader = new AssetLoader();
        this.renderer = new Renderer(canvasElement, this.assetLoader);

        // World
        this.world = createRootEntity();
        this.world.gameTime = this.gameTime;
        generateMap(this.world);
        //Set the camera position
        const playerEntity = firstChildWhere(this.world, (child) => {
            return child.id.includes("player-worker");
        });
        if (!!playerEntity) {
            const newPosition = multiplyPoint(
                playerEntity.worldPosition,
                TileSize,
            );
            this.renderer.camera.position = newPosition;
        }

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

    private onTick = () => {
        this.drawTick += 1;
        if (this.drawTick % 5 == 0) {
            this.updateTick += 1;
            this.gameTime.tick = this.updateTick;
            this.world.onUpdate(this.updateTick);
            this.interactionHandler.onUpdate(this.updateTick);
            this.updateVisibilityMap();
        }
        this.renderer.context.drawTick = this.drawTick;
        this.render(DrawMode.Tick);
    };

    private updateCamera(newPosition: Point) {
        this.renderer.camera.position = newPosition;
        this.render(DrawMode.Gesture);
    }

    private updateVisibilityMap() {
        this.visibilityMap.clear();
        if (this.visibilityMap.useVisibility) {
            const visibilityComponents =
                this.world.queryComponents(VisibilityComponent);

            for (const visibilityComponent of visibilityComponents) {
                const visiblePoints = visibilityComponent.getVisibility();
                for (const visiblePoint of visiblePoints) {
                    this.visibilityMap.setIsVisible(visiblePoint, true);
                }
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

        this.render(DrawMode.Gesture);
    }

    private render(drawMode: DrawMode) {
        const renderStart = performance.now();
        this.renderer.clearScreen();
        this.world.onDraw(this.renderer.context, this.visibilityMap, drawMode);
        this.interactionHandler.onDraw(this.renderer.context);
        this.renderer.renderDeferred();
        performance.measure;
        //performance.measure("render duration", "render-start");
        const renderEnd = performance.now();
        //console.log("⏱render time: ", renderEnd - renderStart);
    }
}

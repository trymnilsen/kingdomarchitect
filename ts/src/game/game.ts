import {
    changeX,
    changeY,
    invert,
    multiplyPoint,
    Point,
} from "../common/point.js";
import { AssetLoader } from "../module/asset/loader/assetLoader.js";

import { GameTime } from "../common/time.js";
import { Input, InputEvent } from "../input/input.js";
import { InputActionType } from "../input/inputAction.js";
import { TouchInput } from "../input/touchInput.js";
import { EcsWorld } from "../module/ecs/ecsWorld.js";
import { Camera } from "../rendering/camera.js";
import { DrawMode } from "../rendering/drawMode.js";
import { Renderer } from "../rendering/renderer.js";
import { RenderVisibilityMap } from "../rendering/renderVisibilityMap.js";
import { VisibilityComponent } from "./componentOld/visibility/visibilityComponent.js";
import { firstChildWhere } from "./entity/child/first.js";
import { Entity } from "./entity/entity.js";
import { createRootEntity } from "./entity/rootEntity.js";
import { InteractionHandler } from "./interaction/handler/interactionHandler.js";
import { addInitialPlayerChunk } from "./map/player.js";
import { TileSize } from "./map/tile.js";
import { renderSystem } from "./system/renderSystem.js";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private touchInput: TouchInput;
    private interactionHandler: InteractionHandler;

    private assetLoader: AssetLoader;
    private drawTick = 0;
    private updateTick = 0;
    private world: Entity;
    private camera: Camera;
    private gameTime: GameTime = new GameTime();
    private ecsWorld: EcsWorld;
    private visibilityMap: RenderVisibilityMap = new RenderVisibilityMap();

    constructor(private domElementWrapperSelector: string) {
        this.world = createRootEntity();
        this.ecsWorld = new EcsWorld(this.world);
        this.assetLoader = new AssetLoader();
        // Rendering
        this.camera = new Camera({
            x: window.innerWidth,
            y: window.innerHeight,
        });
        // World
        this.world.gameTime = this.gameTime;

        const canvasElement: HTMLCanvasElement | null = document.querySelector(
            `#${this.domElementWrapperSelector}`,
        );

        if (canvasElement == null) {
            throw new Error("Canvas element not found");
        }

        this.renderer = new Renderer(
            canvasElement,
            this.assetLoader,
            this.camera,
        );

        // Input
        this.input = new Input();
        this.touchInput = new TouchInput(canvasElement);

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

        this.addSystems();
    }

    private addSystems() {
        this.ecsWorld.addSystem(renderSystem);
    }

    async bootstrap(): Promise<void> {
        console.log("bootstrap");
        this.assetLoader.load();
        addInitialPlayerChunk(this.world);
        //Set the camera position
        const playerEntity = firstChildWhere(this.world, (child) => {
            return child.id.includes("worker");
        });
        if (!!playerEntity) {
            const newPosition = multiplyPoint(
                playerEntity.worldPosition,
                TileSize,
            );
            this.renderer.camera.position = newPosition;
        }

        this.updateVisibilityMap();

        await this.assetLoader.loaderPromise;
        console.log("Finished loading");
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
        this.render(DrawMode.Gesture);
    }

    private onTick = () => {
        this.drawTick += 1;
        if (this.drawTick % 5 == 0) {
            this.updateTick += 1;
            this.gameTime.tick = this.updateTick;
            this.ecsWorld.runUpdate(this.updateTick);
            //this.world.onUpdate(this.updateTick);
            //housingSystem(this.world);
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
                this.world.queryComponentsOld(VisibilityComponent);
            for (let i = 0; i < visibilityComponents.length; i++) {
                const component = visibilityComponents[i];
                const visiblePoints = component.getVisibility();
                for (let p = 0; p < visiblePoints.length; p++) {
                    this.visibilityMap.setIsVisible(
                        visiblePoints[p].x,
                        visiblePoints[p].y,
                        true,
                    );
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
        this.renderer.clearScreen();
        //TODO: use the world/root entity to get chunkmap
        //get entities within the viewport
        //call draw on these
        this.ecsWorld.runRender(
            this.renderer.context,
            this.visibilityMap,
            drawMode,
        );

        this.interactionHandler.onDraw(this.renderer.context);
        this.renderer.renderDeferred();

        //console.log("⏱render time: ", renderEnd - renderStart);
    }
}

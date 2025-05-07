import { invert, multiplyPoint, Point } from "../common/point.js";
import { AssetLoader } from "../module/asset/loader/assetLoader.js";

import { GameTime } from "../common/time.js";
import { EcsWorld } from "../module/ecs/ecsWorld.js";
import { Input, InputEvent } from "../module/input/input.js";
import { TouchInput } from "../module/input/touchInput.js";
import { addInitialPlayerChunk } from "../module/map/player.js";
import { TileSize } from "../module/map/tile.js";
import { Camera } from "../rendering/camera.js";
import { DrawMode } from "../rendering/drawMode.js";
import { Renderer } from "../rendering/renderer.js";
import { RenderVisibilityMap } from "../rendering/renderVisibilityMap.js";
import { firstChildWhere } from "./entity/child/first.js";
import { InteractionHandler } from "./interaction/handler/interactionHandler.js";
import { chunkMapSystem } from "./system/chunkMapSystem.js";
import { renderSystem } from "./system/renderSystem.js";
import { worldGenerationSystem } from "./system/worldGenerationSystem.js";
import { createClientDispatcher } from "./action/dispatcher/client/clientDispatcher.js";
import type { ActionDispatcher } from "../module/action/actionDispatcher.js";
import { GameServerConnection } from "./connection/gameServerConnection.js";
import { WebworkerServerConnection } from "./connection/webworkerServerConnection.js";
import { handleGameMessage } from "./action/messages/gameMessageHandler.js";
import { pathfindingSystem } from "./system/pathfindingSystem.js";
import type { EntityAction } from "../module/action/entityAction.js";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private touchInput: TouchInput;
    private interactionHandler: InteractionHandler;

    private assetLoader: AssetLoader;
    private drawTick = 0;
    private updateTick = 0;
    private camera: Camera;
    private gameTime: GameTime = new GameTime();
    private ecsWorld: EcsWorld;
    private visibilityMap: RenderVisibilityMap = new RenderVisibilityMap();
    private actionDispatcher: ActionDispatcher;
    private gameServer: GameServerConnection;

    constructor(private domElementWrapperSelector: string) {
        this.ecsWorld = new EcsWorld();
        this.gameServer = new WebworkerServerConnection();
        this.gameServer.onMessage.listen((message) => {
            handleGameMessage(message, this.ecsWorld.root);
        });
        this.actionDispatcher = createClientDispatcher(this.ecsWorld.root);
        this.ecsWorld.root.actionDispatch = (action: EntityAction) => {
            this.actionDispatcher(action);
            this.gameServer.postAction(action);
        };
        this.assetLoader = new AssetLoader();
        // Rendering
        this.camera = new Camera({
            x: window.innerWidth,
            y: window.innerHeight,
        });

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
            this.ecsWorld.root,
            this.renderer.camera,
            this.assetLoader,
            this.gameTime,
            () => {
                this.visibilityMap.useVisibility =
                    !this.visibilityMap.useVisibility;
                this.render(DrawMode.Gesture);
            },
        );

        this.addSystems();
    }

    private addSystems() {
        this.ecsWorld.addSystem(renderSystem);
        this.ecsWorld.addSystem(chunkMapSystem);
        this.ecsWorld.addSystem(pathfindingSystem);
        //this.ecsWorld.addSystem(worldGenerationSystem);
    }

    async bootstrap(): Promise<void> {
        console.log("bootstrap");
        this.assetLoader.load();
        this.ecsWorld.runInit();
        //Set the camera position
        const newPosition = multiplyPoint({ x: 4, y: 4 }, TileSize);
        this.renderer.camera.position = newPosition;

        await this.assetLoader.loaderPromise;
        console.log("Finished loading");
        this.setupInputListeners();
        setInterval(this.onTick, 200);
        this.render(DrawMode.Gesture);
    }

    private setupInputListeners() {
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
    }

    private onTick = () => {
        this.drawTick += 1;
        if (this.drawTick % 5 == 0) {
            this.updateTick += 1;
            this.gameTime.tick = this.updateTick;
            this.ecsWorld.runUpdate(this.updateTick);
            this.interactionHandler.onUpdate(this.updateTick);
        }
        this.renderer.context.drawTick = this.drawTick;
        this.render(DrawMode.Tick);
    };

    private updateCamera(newPosition: Point) {
        this.renderer.camera.position = newPosition;
        this.render(DrawMode.Gesture);
    }

    private onInput(inputEvent: InputEvent) {
        this.interactionHandler.onInput(inputEvent.action);
        this.render(DrawMode.Gesture);
    }

    private render(drawMode: DrawMode) {
        this.renderer.clearScreen();
        this.ecsWorld.runRender(
            this.renderer.context,
            this.visibilityMap,
            drawMode,
        );

        this.interactionHandler.onDraw(this.renderer.context);
        this.renderer.renderDeferred();
    }
}

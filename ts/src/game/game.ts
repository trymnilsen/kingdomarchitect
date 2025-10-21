import { invert, multiplyPoint, Point } from "../common/point.js";
import { AssetLoader } from "../asset/loader/assetLoader.js";

import { GameTime } from "../common/time.js";
import { EcsWorld } from "../common/ecs/ecsWorld.js";
import { Input, InputEvent } from "../input/input.js";
import { TouchInput } from "../input/touchInput.js";
import { TileSize } from "./map/tile.js";
import { UiRenderer } from "../ui/declarative/ui.js";
import { Camera } from "../rendering/camera.js";
import { DrawMode } from "../rendering/drawMode.js";
import { Renderer } from "../rendering/renderer.js";
import { RenderVisibilityMap } from "../rendering/renderVisibilityMap.js";
import { GameServerConnection } from "../server/gameServerConnection.js";
import { WebworkerServerConnection } from "../server/webworkerServerConnection.js";
import { InteractionHandler } from "./interaction/handler/interactionHandler.js";
import { chunkMapSystem } from "./system/chunkMapSystem.js";
import { pathfindingSystem } from "./system/pathfindingSystem.js";
import { renderSystem } from "./system/renderSystem.js";
import { createVisibilityMapComponent } from "./component/visibilityMapComponent.js";
import { handleGameMessage } from "../server/message/gameMessageHandler.js";
import { animationSystem } from "./system/animationSystem.js";
import { createJobQueueComponent } from "./component/jobQueueComponent.js";
import { createTileComponent } from "./component/tileComponent.js";
import { Entity } from "./entity/entity.js";
import { getOverworldEntity } from "./map/scenes.js";

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
    private gameServer: GameServerConnection;

    constructor(private domElementWrapperSelector: string) {
        this.ecsWorld = new EcsWorld();
        this.addClientOnlyComponents();
        this.camera = new Camera(
            {
                x: window.innerWidth,
                y: window.innerHeight,
            },
            getOverworldEntity(this.ecsWorld.root),
        );

        this.gameServer = new WebworkerServerConnection();
        this.gameServer.onMessage.listen((message) => {
            handleGameMessage(this.ecsWorld.root, this.camera, message);
            this.ecsWorld.runGameMessage(message);
        });
        this.assetLoader = new AssetLoader();

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
            this.ecsWorld,
            this.renderer.camera,
            this.assetLoader,
            this.gameTime,
            new UiRenderer(this.renderer.context),
            (command) => {
                this.gameServer.postCommand(command);
            },
            () => {
                this.visibilityMap.useVisibility =
                    !this.visibilityMap.useVisibility;
                this.render(DrawMode.Gesture);
            },
        );

        this.addSystems();
    }

    private addClientOnlyComponents() {
        this.ecsWorld.root.setEcsComponent(createJobQueueComponent());
        const overworld = getOverworldEntity(this.ecsWorld.root);
        overworld.setEcsComponent(createTileComponent());
        overworld.setEcsComponent(createVisibilityMapComponent());
    }

    private addSystems() {
        this.ecsWorld.addSystem(chunkMapSystem);
        this.ecsWorld.addSystem(pathfindingSystem);
        this.ecsWorld.addSystem(animationSystem);
        this.ecsWorld.addSystem(renderSystem);
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
        this.ecsWorld.runRender(this.renderer.context, this.drawTick, drawMode);
        this.interactionHandler.onDraw(this.renderer.context);
        this.renderer.renderDeferred();
    }
}

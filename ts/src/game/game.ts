import { invert, multiplyPoint, Point } from "../common/point.ts";
import { AssetLoader } from "../asset/loader/assetLoader.ts";

import { GameTime } from "../common/time.ts";
import { EcsWorld } from "../common/ecs/ecsWorld.ts";
import { Input, InputEvent } from "../input/input.ts";
import { TouchInput } from "../input/touchInput.ts";
import { TileSize } from "./map/tile.ts";
import { UiRenderer } from "../ui/declarative/ui.ts";
import { Camera } from "../rendering/camera.ts";
import { DrawMode } from "../rendering/drawMode.ts";
import { Renderer } from "../rendering/renderer.ts";
import { RenderVisibilityMap } from "../rendering/renderVisibilityMap.ts";
import { GameServerConnection } from "../server/gameServerConnection.ts";
import { WebworkerServerConnection } from "../server/webworkerServerConnection.ts";
import { InteractionHandler } from "./interaction/handler/interactionHandler.ts";
import { chunkMapSystem } from "./system/chunkMapSystem.ts";
import { pathfindingSystem } from "./system/pathfindingSystem.ts";
import { renderSystem } from "./system/renderSystem.ts";
import { createVisibilityMapComponent } from "./component/visibilityMapComponent.ts";
import { handleGameMessage } from "../server/message/gameMessageHandler.ts";
import { createAnimationSystem } from "./system/animationSystem.ts";
import { createJobQueueComponent } from "./component/jobQueueComponent.ts";
import { createTileComponent } from "./component/tileComponent.ts";
import { createSpriteEquipmentSystem } from "./system/spriteEquipmentSystem.ts";
import { SpriteDefinitionCache } from "../characterbuilder/characterSpriteGenerator.ts";
import { createRootEntity } from "./rootFactory.ts";

export class Game {
    private renderer: Renderer;
    private input: Input;
    private touchInput: TouchInput;
    private interactionHandler: InteractionHandler;

    private assetLoader: AssetLoader;
    private spriteCache: SpriteDefinitionCache = new SpriteDefinitionCache();
    private drawTick = 0;
    private updateTick = 0;
    private camera: Camera;
    private gameTime: GameTime = new GameTime();
    private ecsWorld: EcsWorld;
    private visibilityMap: RenderVisibilityMap = new RenderVisibilityMap();
    private gameServer: GameServerConnection;
    private domElementWrapperSelector: string;

    constructor(domElementWrapperSelector: string) {
        this.domElementWrapperSelector = domElementWrapperSelector;
        const root = createRootEntity();
        this.ecsWorld = new EcsWorld(root);
        this.addClientOnlyComponents();
        this.camera = new Camera({
            x: window.innerWidth,
            y: window.innerHeight,
        });

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

    /**
     * Adds client-only components that are never replicated from the server.
     * These components are preserved when the server sends entity updates via merging.
     *
     * Client-only components include:
     * - JobQueue: Client-side job visualization/UI
     * - Tile: Client-side tile rendering cache
     * - VisibilityMap: Client-side fog-of-war rendering
     */
    private addClientOnlyComponents() {
        this.ecsWorld.root.setEcsComponent(createJobQueueComponent());
        this.ecsWorld.root.setEcsComponent(createTileComponent());
        this.ecsWorld.root.setEcsComponent(createVisibilityMapComponent());
    }

    private addSystems() {
        this.ecsWorld.addSystem(chunkMapSystem);
        this.ecsWorld.addSystem(pathfindingSystem);
        this.ecsWorld.addSystem(createAnimationSystem(this.spriteCache));
        this.ecsWorld.addSystem(renderSystem);
        this.ecsWorld.addSystem(
            createSpriteEquipmentSystem(
                (width, height) =>
                    this.renderer.context.getOffscreenRenderScope(
                        width,
                        height,
                    ),
                this.assetLoader,
                this.spriteCache,
            ),
        );
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

import { log } from "../common/logging/logger.ts";
import { multiplyPoint, type Point } from "../common/point.ts";
import { AssetLoader } from "../asset/loader/assetLoader.ts";

import { GameTime } from "../common/time.ts";
import { EcsWorld } from "../common/ecs/ecsWorld.ts";
import { Input, type InputEvent } from "../input/input.ts";
import { TouchInput } from "../input/touchInput.ts";
import { TileSize } from "./map/tile.ts";
import { UiRenderer } from "../ui/declarative/ui.ts";
import { Camera } from "../rendering/camera.ts";
import { DrawMode } from "../rendering/drawMode.ts";
import { Renderer } from "../rendering/renderer.ts";
import { RenderVisibilityMap } from "../rendering/renderVisibilityMap.ts";
import type { GameServerConnection } from "../server/gameServerConnection.ts";
import { InteractionHandler } from "./interaction/handler/interactionHandler.ts";
import { wireGameInput } from "./gameInput.ts";
import { chunkMapSystem } from "./system/chunkMapSystem.ts";
import { pathfindingSystem } from "./system/pathfindingSystem.ts";
import { renderSystem } from "./system/renderSystem.ts";
import { createVisibilityMapComponent } from "./component/visibilityMapComponent.ts";
import { handleGameMessage } from "../server/message/gameMessageHandler.ts";
import { createAnimationSystem } from "./system/animationSystem.ts";
import { createJobQueueComponent } from "./component/jobQueueComponent.ts";
import { createTileComponent } from "./component/tileComponent.ts";
import { createSpriteEquipmentSystem } from "./system/spriteEquipmentSystem.ts";
import { createAttackVfxSystem } from "./system/attackVfxSystem.ts";
import { despawnTimerSystem } from "./system/despawnTimerSystem.ts";
import { SpriteDefinitionCache } from "../characterbuilder/characterSpriteGenerator.ts";
import { createRootEntity } from "./rootFactory.ts";
import { DayComponentId, phaseBackgroundColor } from "./component/dayComponent.ts";
import { WorldStateMessageType } from "../server/message/gameMessage.ts";

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
    /**
     * Handle of the animation frame scheduled to render the in-progress drag,
     * or null when none is pending. Panning mutates the camera synchronously on
     * every native move event but renders at most once per frame: the many move
     * events that arrive between paints coalesce into a single render of the
     * latest camera state. This is scoped to an active gesture — a frame is only
     * ever requested in response to a move, and nothing reschedules once the
     * finger stops — so it is not a persistent render loop.
     */
    private panRenderHandle: number | null = null;

    constructor(
        domElementWrapperSelector: string,
        serverConnection: GameServerConnection,
    ) {
        this.domElementWrapperSelector = domElementWrapperSelector;
        const root = createRootEntity();
        this.ecsWorld = new EcsWorld(root);
        this.addClientOnlyComponents();
        this.camera = new Camera({
            x: window.innerWidth,
            y: window.innerHeight,
        });

        this.gameServer = serverConnection;
        this.gameServer.onMessage.listen((message) => {
            if (message.type === WorldStateMessageType) {
                this.updateTick = message.serverTick;
                this.gameTime.tick = message.serverTick;
            }
            handleGameMessage(this.ecsWorld.root, message);
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
            serverConnection.gameSaveCapability,
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
        this.ecsWorld.addSystem(createAttackVfxSystem(this.gameTime));
        this.ecsWorld.addSystem(despawnTimerSystem);
    }

    async bootstrap(): Promise<void> {
        log.info("bootstrap");
        this.assetLoader.load();
        this.ecsWorld.runInit();
        //Set the camera position
        const newPosition = multiplyPoint({ x: 4, y: 4 }, TileSize);
        this.renderer.camera.position = newPosition;

        await this.assetLoader.loaderPromise;
        log.info("Finished loading");
        this.setupInputListeners();
        setInterval(this.onTick, 200);
        this.render(DrawMode.Gesture);
    }

    private setupInputListeners() {
        wireGameInput(
            this.touchInput,
            this.interactionHandler,
            this.renderer.camera,
            // Discrete gestures (tap down/up/cancel) render immediately; panning
            // coalesces its render onto the next animation frame so a burst of
            // move events between paints draws once.
            () => this.renderGesture(),
            () => this.requestPanRender(),
        );

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

    /**
     * Schedule a single gesture render on the next animation frame. If one is
     * already scheduled this is a no-op, so a burst of move events between
     * paints collapses to one render of the latest (already-applied) camera.
     */
    private requestPanRender() {
        if (this.panRenderHandle !== null) {
            return;
        }
        this.panRenderHandle = requestAnimationFrame(() => {
            this.panRenderHandle = null;
            this.render(DrawMode.Gesture);
        });
    }

    private cancelPanRender() {
        if (this.panRenderHandle !== null) {
            cancelAnimationFrame(this.panRenderHandle);
            this.panRenderHandle = null;
        }
    }

    /**
     * Render a discrete gesture (tap down/up/cancel) right away. Any frame still
     * queued for an in-progress drag is superseded by this paint, so it is
     * cancelled to avoid a redundant draw on the next animation frame. The
     * immediate render at the end of a gesture also lands the final position.
     */
    private renderGesture() {
        this.cancelPanRender();
        this.render(DrawMode.Gesture);
    }

    private render(drawMode: DrawMode) {
        const day = this.ecsWorld.root.getEcsComponent(DayComponentId);
        this.renderer.clearScreen(phaseBackgroundColor(day?.phase ?? "dawn"));
        this.ecsWorld.runRender(this.renderer.context, this.drawTick, drawMode);
        this.interactionHandler.onDraw(this.renderer.context);
        this.renderer.renderDeferred();
    }
}

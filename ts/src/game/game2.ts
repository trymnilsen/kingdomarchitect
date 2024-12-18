import { AssetLoader } from "../asset/loader/assetLoader.js";
import { Point } from "../common/point.js";
import { GameTime } from "../common/time.js";
import { EcsWorld } from "../ecs/ecsWorld.js";
import { RootEntity } from "../ecs/ecsWorldScope.js";
import { EcsInitEvent } from "../ecs/event/ecsInitEvent.js";
import { EcsInputEvent } from "../ecs/event/ecsInputEvent.js";
import { EcsRenderEvent } from "../ecs/event/ecsRenderEvent.js";
import { EcsUpdateEvent } from "../ecs/event/ecsUpdateEvent.js";
import { Input } from "../input/input.js";
import { TouchInput } from "../input/touchInput.js";
import { LazyGraph } from "../path/graph/lazyGraph.js";
import { DrawMode } from "../rendering/drawMode.js";
import { Renderer } from "../rendering/renderer.js";
import { ChunkMapComponent } from "./ecsComponent/world/chunkmapComponent.js";
import { PathfindingComponent } from "./ecsComponent/world/pathfindingComponent.js";
import { queryWeight } from "./ecsComponent/world/worldQuery.js";
import { Entity } from "./entity/entity.js";
import { InteractionHandler } from "./interaction/handler/interactionHandler.js";
import { createAggroSystem } from "./system/aggroSystem.js";
import { createBattleQueueSystem } from "./system/battleQueueSystem.js";
import { createBuildingSystem } from "./system/buildingSystem.js";
import { createCollisionSystem } from "./system/collisionMapSystem.js";
import { createCraftingSystem } from "./system/craftingSystem.js";
import { createEffectSystem } from "./system/effectSystem.js";
import { createHealthQueueSystem } from "./system/healthQueueSystem.js";
import { createHousingSystem } from "./system/housingSystem.js";
import { createJobSystem } from "./system/jobSystem.js";
import { createPathfindingSystem } from "./system/pathfindingSystem.js";
import { createRenderSystem } from "./system/renderSystem.js";
import { createResourceSystem } from "./system/resourceSystem.js";
import { createTileRenderSystem } from "./system/tileRendererSystem.js";
import { createUiSystem } from "./system/uiSystem.js";
import { createVisibilitySystem } from "./system/visiblitySystem.js";
import { createWorldGenerationSystem } from "./system/worldGenerationSystem.js";

export class Game2 {
    private renderer: Renderer;
    private world: EcsWorld;
    private assetLoader: AssetLoader;
    private input: Input;
    private touchInput: TouchInput;
    private interactionHandler: InteractionHandler;
    private drawTick = 0;
    private updateTick = 0;
    private gameTime: GameTime = new GameTime();
    constructor(domElementWrapperSelector: string) {
        // Get the canvas
        const canvasElement: HTMLCanvasElement | null = document.querySelector(
            `#${domElementWrapperSelector}`,
        );

        if (canvasElement == null) {
            throw new Error("Canvas element not found");
        }
        this.assetLoader = new AssetLoader();
        this.renderer = new Renderer(canvasElement, this.assetLoader);

        // Input
        this.input = new Input();
        this.touchInput = new TouchInput(canvasElement);
        // UI states handling
        this.world = new EcsWorld();
        this.interactionHandler = new InteractionHandler(
            new Entity("foo"),
            this.world,
            this.renderer.camera,
            this.assetLoader,
            this.gameTime,
            () => {},
        );
        this.setupSystems();
        this.setupRootComponents();
    }

    async bootstrap(): Promise<void> {
        console.log("Bootstrap game");
        const loaderPromise = this.assetLoader.load();
        this.setupInput();
        await loaderPromise;
        console.log("Bootstrap game finished");
        this.world.dispatchEvent(new EcsInitEvent());
        setInterval(this.onTick.bind(this), 200);
        this.render(DrawMode.Gesture);
    }

    private onTick() {
        this.drawTick += 1;
        if (this.drawTick % 5 == 0) {
            this.updateTick += 1;
            this.world.dispatchEvent(new EcsUpdateEvent());
            //this.interactionHandler.onUpdate(this.updateTick);
        }

        this.render(DrawMode.Tick);
    }

    private setupSystems() {
        this.world.addSystems([
            createWorldGenerationSystem(),
            createCollisionSystem(),
            createAggroSystem(),
            createBattleQueueSystem(),
            createCraftingSystem(),
            createEffectSystem(),
            createHealthQueueSystem(),
            createHousingSystem(),
            createJobSystem(),
            createPathfindingSystem(),
            createBuildingSystem(),
            createTileRenderSystem(),
            createRenderSystem(),
            createResourceSystem(),
            createUiSystem(this.interactionHandler, this.renderer.camera),
            createVisibilitySystem(),
        ]);
    }

    private setupRootComponents() {
        this.world.addComponent(RootEntity, new ChunkMapComponent());
        this.world.addComponent(
            RootEntity,
            new PathfindingComponent(
                new LazyGraph((point) => {
                    return queryWeight(this.world, point);
                }),
            ),
        );
    }

    private setupInput() {
        this.touchInput.onTapDown = (position: Point) => {
            const event = new EcsInputEvent({
                id: "tap-down",
                position: position,
            });
            this.world.dispatchEvent(event);
            this.render(DrawMode.Gesture);
            return event.handled;
        };

        this.touchInput.onPan = (
            movement: Point,
            position: Point,
            startPosition: Point,
            downTapHandled: boolean,
        ) => {
            this.world.dispatchEvent(
                new EcsInputEvent({
                    id: "pan",
                    movement,
                    position,
                    startPosition,
                    downTapHandled,
                }),
            );
            this.render(DrawMode.Gesture);
        };

        this.touchInput.onTapEnd = (tapEndEvent) => {
            //this.interactionHandler.onTapUp(tapEndEvent);
            this.world.dispatchEvent(
                new EcsInputEvent({
                    id: "tap-end",
                    position: tapEndEvent.position,
                    startPosition: tapEndEvent.startPosition,
                    wasDragging: tapEndEvent.wasDragging,
                }),
            );
            this.render(DrawMode.Gesture);
        };

        this.input.onInput.listen((inputEvent) => {
            this.world.dispatchEvent(
                new EcsInputEvent({ id: "action", action: inputEvent.action }),
            );
        });
    }

    private render(drawMode: DrawMode) {
        this.renderer.clearScreen();
        this.world.dispatchEvent(
            new EcsRenderEvent(this.renderer.context, drawMode),
        );
    }
}

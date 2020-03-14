import { WorldScene, WorldSceneName } from "./gameScene/world/worldScene";
import { GameSceneHandler } from "./gameScene/gameScene";
import { Renderer } from "./rendering/renderer";
import { Input, InputEventToAction } from "../input/input";
import { JsonNode, JsonTree } from "../state/jsonNode";
import { Dispatcher } from "../action/dispatcher";
import { rootReducer } from "../action/reducer";
import { DataTree, pathsEqual } from "../state/dataNode";
import { Player } from "../data/player";
import { Point } from "../data/point";
import { getPlayerPosition } from "./gameScene/world/player";
import { initChunkAction } from "../action/chunk/createChunkReducer";
import { onTickAction } from "../action/tick/tickReducer";

export class Game {
    private sceneHandler: GameSceneHandler;
    private renderer: Renderer;
    private input: Input;
    private state: DataTree;
    private dispatcher: Dispatcher;
    public constructor(domElementWrapperSelector: string) {
        this.input = new Input();
        this.state = new DataTree();
        this.state.get("focus").set("player");
        this.state.get(["world", "player", "position"]).set({ x: 0, y: 0 });
        this.dispatcher = new Dispatcher(rootReducer, this.state);
        //Input
        this.input.onInput.listen((inputEvent) => {
            console.log("Input", inputEvent);
            const action = InputEventToAction(inputEvent);
            this.dispatcher.doAction(action);
        });
        this.renderer = new Renderer(domElementWrapperSelector);
        this.sceneHandler = new GameSceneHandler();

        this.sceneHandler.registerScene(WorldSceneName, new WorldScene());

        this.sceneHandler.transition(WorldSceneName);
        this.renderer.camera.center({ x: 0, y: 0 });

        this.state.listenForAnyStateChange(() => {
            //console.log("Update!");
            this.renderer.camera.follow(getPlayerPosition(this.state));
            this.render();
        });
        this.dispatcher.doAction(initChunkAction());

        for (let i = 0; i < 32; i++) {
            this.dispatcher.doAction(onTickAction());
        }
        this.render();
    }

    private render() {
        const rootNode = this.sceneHandler.currentGameScene.render(this.state);
        //TODO: Setup input
        this.renderer.render(rootNode);
    }

    public dispose(): any {
        this.sceneHandler.disposeAllScenes();
    }
}

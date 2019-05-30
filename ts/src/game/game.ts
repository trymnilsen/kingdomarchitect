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
        this.state.get(["player", "position"]).set({ x: 0, y: 0 });
        this.dispatcher = new Dispatcher(rootReducer, this.state);
        //Input
        this.input.onInput.listen((inputEvent) => {
            console.log("Input", inputEvent);
            const action = InputEventToAction(inputEvent);
            this.dispatcher.doAction(action);
        });
        this.renderer = new Renderer(domElementWrapperSelector);
        this.sceneHandler = new GameSceneHandler();

        this.sceneHandler.registerScene(
            WorldSceneName,
            new WorldScene(this.renderer.rootNode, this.state)
        );

        this.sceneHandler.transition(WorldSceneName);

        //TODO: Setup input
        this.renderer.render();

        this.state.get("player").listen((event) => {
            if (pathsEqual(event.path, ["player", "position"])) {
                this.renderer.camera.follow(event.data as Point);
            }
            this.renderer.render();
        });
    }

    public dispose(): any {
        this.sceneHandler.disposeAllScenes();
    }
}

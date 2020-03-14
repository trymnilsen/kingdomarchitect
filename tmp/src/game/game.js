"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worldScene_1 = require("./gameScene/world/worldScene");
const gameScene_1 = require("./gameScene/gameScene");
const renderer_1 = require("./rendering/renderer");
const input_1 = require("../input/input");
const dispatcher_1 = require("../action/dispatcher");
const reducer_1 = require("../action/reducer");
const dataNode_1 = require("../state/dataNode");
class Game {
    constructor(domElementWrapperSelector) {
        this.input = new input_1.Input();
        this.state = new dataNode_1.DataTree();
        this.state.get("focus").set("player");
        this.state.get(["player", "position"]).set({ x: 1, y: 1 });
        this.dispatcher = new dispatcher_1.Dispatcher(reducer_1.rootReducer, this.state);
        //Input
        this.input.onInput.listen((inputEvent) => {
            console.log("Input", inputEvent);
            const action = input_1.InputEventToAction(inputEvent);
            this.dispatcher.doAction(action);
        });
        this.renderer = new renderer_1.Renderer(domElementWrapperSelector);
        this.sceneHandler = new gameScene_1.GameSceneHandler();
        this.sceneHandler.registerScene(worldScene_1.WorldSceneName, new worldScene_1.WorldScene(this.renderer.rootNode, this.state));
        this.sceneHandler.transition(worldScene_1.WorldSceneName);
        this.renderer.camera.center({ x: 1, y: 1 });
        //TODO: Setup input
        this.renderer.render();
        this.state.get("player").listen((event) => {
            if (dataNode_1.pathsEqual(event.path, ["player", "position"])) {
                this.renderer.camera.follow(event.data);
            }
            this.renderer.render();
        });
    }
    dispose() {
        this.sceneHandler.disposeAllScenes();
    }
}
exports.Game = Game;
//# sourceMappingURL=game.js.map
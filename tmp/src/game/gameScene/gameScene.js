"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GameSceneHandler {
    constructor() {
        this.scenes = {};
    }
    registerScene(name, scene) {
        this.scenes[name] = scene;
    }
    transition(toName) {
        const newScene = this.scenes[toName];
        if (!newScene) {
            throw new Error("Invalid scene name, cannot transition");
        }
        if (!!this.currentScene) {
            this.currentScene.dispose();
        }
        newScene.transitionTo();
        this.currentScene = newScene;
    }
    disposeAllScenes() {
        Object.values(this.scenes).forEach((scene) => scene.dispose());
    }
    get currentGameScene() {
        return this.currentGameScene;
    }
}
exports.GameSceneHandler = GameSceneHandler;
//# sourceMappingURL=gameScene.js.map
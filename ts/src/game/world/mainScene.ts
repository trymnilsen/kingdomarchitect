import { InputAction } from "../../input/inputAction";
import { RenderContext } from "../../rendering/renderContext";
import { Scene } from "../../scene/scene";
import { SceneNode } from "../../scene/sceneNode";
import { Ground } from "./entity/ground";

export class MainScene implements Scene {
    private ground: Ground;
    constructor() {
        this.ground = new Ground();
    }

    input(action: InputAction): void {
        for (let index = 0; index < 32; index++) {
            this.ground.generate();
        }
    }

    drawScene(context: RenderContext): void {
        this.ground.onDraw(context);
    }
}

//Move drawing logic into ground
//Generate groud on each input

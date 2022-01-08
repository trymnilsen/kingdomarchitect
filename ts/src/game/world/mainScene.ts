import { Point } from "../../common/point";
import { InputAction } from "../../input/inputAction";
import { RenderContext } from "../../rendering/renderContext";
import { Scene } from "../../scene/scene";
import { SceneNode } from "../../scene/sceneNode";
import { Ground } from "./entity/ground";

export class MainScene implements Scene {
    private ground: Ground;
    private cursorPosition: Point | null = null;
    constructor() {
        this.ground = new Ground();
    }
    tick(tick: number): void {
        if (tick % 10 == 0) {
            console.log("Generate tick");
            this.ground.generate();
        }
    }
    tap(worldPoint: Point): void {
        const tile = this.ground.getTile(worldPoint);
        if (tile) {
            this.cursorPosition = {
                x: Math.floor(worldPoint.x / 32) * 32,
                y: Math.floor(worldPoint.y / 32) * 32,
            };
            console.log("Tile clicked: ", tile);
        } else {
            console.log("No tile found");
            this.cursorPosition = null;
        }
    }

    input(action: InputAction): void {}

    drawScene(context: RenderContext): void {
        this.ground.onDraw(context);
        if (this.cursorPosition) {
            context.drawRectangle({
                x: this.cursorPosition.x + 1,
                y: this.cursorPosition.y + 1,
                width: 28,
                height: 28,
                strokeColor: "red",
                strokeWidth: 2,
            });
        }
    }
}

//Move drawing logic into ground
//Generate groud on each input

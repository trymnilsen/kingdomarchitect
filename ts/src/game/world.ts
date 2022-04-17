import { RenderContext } from "../rendering/renderContext";
import { Ground } from "./entity/ground";
import { Heroes } from "./entity/heroes";

export class World {
    private _ground: Ground;

    public get ground(): Ground {
        return this._ground;
    }

    constructor() {
        this._ground = new Ground();
        for (let i = 0; i < 10; i++) {
            this.ground.generate();
        }
    }

    tick(tick: number): void {
        if (tick % 10 == 0) {
            console.log("Generate tick");
            this.ground.generate();
        }
    }

    onDraw(context: RenderContext): void {
        this.ground.onDraw(context);
    }
}

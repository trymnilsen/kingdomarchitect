import {
    addPoint,
    multiplyPoint,
    Point,
    pointEquals,
    zeroPoint,
} from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";
import { heroVisual } from "../../visual/hero/heroVisual";

export class Heroes {
    private heroes: Hero[] = [];
    constructor() {
        this.heroes = [new Hero()];
    }

    getHero(tilePosition: Point): Hero | null {
        return (
            this.heroes.find((hero) =>
                pointEquals(hero.tilePosition, tilePosition)
            ) || null
        );
    }

    onDraw(context: RenderContext) {
        for (let i = 0; i < this.heroes.length; i++) {
            const hero = this.heroes[i];
            const worldspace = context.camera.tileSpaceToWorldSpace(
                hero.tilePosition
            );
            const offsetPosition = addPoint(worldspace, { x: 6, y: 6 });
            heroVisual(context, offsetPosition);
        }
    }
}

export class Hero {
    private _tilePosition: Point;

    public get tilePosition(): Point {
        return this._tilePosition;
    }

    constructor() {
        this._tilePosition = zeroPoint;
    }
}

import { sprites } from "../../asset/sprite";
import {
    addPoint,
    multiplyPoint,
    Point,
    pointEquals,
    zeroPoint,
} from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";

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
            const offsetPosition = addPoint(worldspace, { x: 4, y: 4 });
            context.drawSprite({
                sprite: sprites.swordsman,
                x: offsetPosition.x,
                y: offsetPosition.y,
            });
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

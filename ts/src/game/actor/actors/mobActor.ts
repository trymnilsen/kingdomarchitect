import { goblinSprite } from "../../../asset/sprites/goblinSprite";
import { Point } from "../../../common/point";
import { Actor } from "./../actor";

export class MobActor extends Actor {
    constructor(position: Point) {
        super(position, goblinSprite);
    }
}

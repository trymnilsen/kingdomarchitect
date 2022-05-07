import { sprites } from "../../asset/sprite";
import { Point } from "../../common/point";
import { Actor } from "./actor";

export class FarmerActor extends Actor {
    constructor(initialPoint: Point) {
        super(initialPoint, sprites.farmer);
    }
}

import { goblinSprite } from "../../asset/sprites/goblinSprite";
import { Point, pointEquals } from "../../common/point";
import { Actor } from "./actor";
import { ActorInstanceJobConstraint } from "./job/constraint/actorInstanceConstraint";
import { Job } from "./job/job";
import { MoveJob } from "./jobs/moveJob";

export class MobActor extends Actor {
    constructor(position: Point) {
        super(position, goblinSprite);
    }
    override onIdle(): Job | null {
        if (pointEquals(this.tilePosition, { x: 4, y: 4 })) {
            return null;
        }

        const path = this.world.findPath(this.tilePosition, {
            x: 4,
            y: 4,
        });

        return new MoveJob(path, new ActorInstanceJobConstraint(this));
    }
}

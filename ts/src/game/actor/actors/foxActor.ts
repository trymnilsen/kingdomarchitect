import { foxSprite } from "../../../asset/sprites/foxSprite";
import { randomEntry } from "../../../common/array";
import { Point } from "../../../common/point";
import { manhattanDistance } from "../../../path/pathHeuristics";
import { Actor } from "./../actor";
import { ActorInstanceJobConstraint } from "./../job/constraint/actorInstanceConstraint";
import { Job } from "./../job/job";
import { MoveJob } from "./../jobs/moveJob";

export class FoxActor extends Actor {
    constructor(initialPoint: Point) {
        super(initialPoint, foxSprite);
    }

    override onIdle(): Job {
        // When the fox becomes idle move to a new random spot
        const possibleSpots = this.world.ground.getTiles((tile) => {
            // Only pick tiles that have a manhattan distance of more than 3
            return (
                manhattanDistance(
                    {
                        x: tile.tileX,
                        y: tile.tileY,
                    },
                    this.tilePosition
                ) > 3
            );
        });
        const randomSpot = randomEntry(possibleSpots);

        const path = this.world.findPath(this.tilePosition, {
            x: randomSpot.tileX,
            y: randomSpot.tileY,
        });

        return new MoveJob(path, new ActorInstanceJobConstraint(this));
    }
}

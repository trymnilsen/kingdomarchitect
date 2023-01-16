import { foxSprite } from "../../../../asset/sprites/foxSprite";
import { Point } from "../../../../common/point";
import { Actor } from "../actor";
import { Job } from "../job/job";

export class FoxActor extends Actor {
    constructor(initialPoint: Point) {
        super(initialPoint, foxSprite);
    }

    override onIdle(): Job | null {
        //TODO: move fox to entity component
        return null;
        /*
        // When the fox becomes idle move to a new random spot
        const possibleSpots = this.world.ground.getTiles((tile) => {
            // Only pick tiles that have a manhattan distance of more than 3
            const tilePoint = {
                x: tile.tileX,
                y: tile.tileY,
            };
            const distance = manhattanDistance(tilePoint, this.tilePosition);
            const hasBuilding = this.world.buildings.getTile(
                getTileId(tile.tileX, tile.tileY)
            );
            return distance > 3 && !hasBuilding;
        });
        const randomSpot = randomEntry(possibleSpots);

        const path = this.world.findPath(this.tilePosition, {
            x: randomSpot.tileX,
            y: randomSpot.tileY,
        });

        if (path.status == PathResultStatus.Complete) {
            return new MoveJob(path.path, new ActorInstanceJobConstraint(this));
        } else {
            return null;
        }*/
    }
}

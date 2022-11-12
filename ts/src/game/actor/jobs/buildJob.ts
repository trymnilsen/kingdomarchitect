import { BuildableEntity } from "../../entity/buildableEntity";
import { GroundTile } from "../../entity/ground";
import { isFarmerJobConstraint } from "../job/constraint/isFarmerActorConstraint";
import { Job } from "../job/job";
import { MoveToBeforeJob } from "./moveToBeforeJob";

export class BuildJob extends MoveToBeforeJob {
    constructor(tileToBuildOn: GroundTile) {
        super(new _BuildJob(tileToBuildOn), isFarmerJobConstraint);
    }
}

class _BuildJob extends Job {
    private tile: GroundTile;

    get tileX(): number {
        return this.tile.tileX;
    }

    get tileY(): number {
        return this.tile.tileY;
    }

    constructor(tile: GroundTile) {
        super();
        this.tile = tile;
    }

    update(tick: number): void {
        //const elapsedTicks = tick - this.startTick;
        const entity = this.actor.world.entities.getTile({
            x: this.tile.tileX,
            y: this.tile.tileY,
        });
        if (entity instanceof BuildableEntity) {
            const buildResult = entity.build(10);
            if (buildResult < 10 || entity.healthPercentage === 1.0) {
                console.log("_BuildJob finished");
                this.complete();
            }
        }
    }
}

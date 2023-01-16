import { BuildableEntity } from "../../entity/v1/buildableEntity";
import { GroundTile } from "../../tile/ground";
import { NeverAssignConstraint } from "../job/constraint/neverAssignConstraint";
import { Job } from "../job/job";
import { MoveToBeforeJob } from "./moveToBeforeJob";

export class BuildJob extends MoveToBeforeJob {
    constructor(tileToBuildOn: GroundTile) {
        super(
            new _BuildJob(tileToBuildOn),
            new NeverAssignConstraint()
        ); /*, isFarmerJobConstraint);*/
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
        //TODO: add back build
        /*
        //const elapsedTicks = tick - this.startTick;
        const entity = this.actor.world.entities.getTile({
            x: this.tile.tileX,
            y: this.tile.tileY,
        });
        if (entity instanceof BuildableEntity) {
            const buildResult = entity.build(10);
            if (buildResult < 10 || entity.healthPercentage === 1.0) {
                console.log("_BuildJob finished");
                this.actor.world.invalidateWorld();
                this.complete();
            }
        }*/
    }
}

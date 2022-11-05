import { woodHouseEntity } from "../../entity/building/woodenHouseEntity";
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
        const elapsedTicks = tick - this.startTick;
        if (elapsedTicks > 2) {
            this.actor.world.buildings.add(
                woodHouseEntity({ x: this.tile.tileX, y: this.tile.tileY })
            );
            console.log("_BuildJob finished");
            this.complete();
        }
    }
}

import { isPointAdjacentTo } from "../../../common/point";
import { RenderContext } from "../../../rendering/renderContext";
import { BlinkingImageAnimation } from "../../../rendering/visual/blinkingImageAnimation";
import { GroundTile } from "../../entity/ground";
import { CoinActor } from "../coinActor";
import { Job } from "../job/job";
import { JobConstraintsError } from "../job/jobConstraintsError";
import { MultipleStepJob } from "../job/multipleStepJob";
import { MoveToJob } from "./moveToJob";

/**
 * Represents a multistep job that will move towards a tree and then chop
 * it down. If the tree is adjacent to the actor doing it, the moving part will
 * be skipped.
 */
export class ChopTreeJob extends MultipleStepJob {
    private tile: GroundTile;

    constructor(tree: GroundTile) {
        super();
        this.tile = tree;
    }

    onStart(): void {
        // If the tree is next to us we just push the chop job
        // if the tree is not next to us we also push a move to job
        const tilePosition = { x: this.tile.tileX, y: this.tile.tileY };
        const subJobs: Job[] = [];
        if (!isPointAdjacentTo(tilePosition, this.actor.tilePosition)) {
            //The tile was not adjacent to us so we need to move to it first
            const path = this.actor.world.findPath(
                this.actor.tilePosition,
                tilePosition
            );
            // The pathfinding will return the selected tile as a position to
            // walk to as well. To avoid ending on top of the tree to chop, we
            // pop the path removing the last position (position of the tree)
            path.pop();

            if (path.length == 0) {
                throw new JobConstraintsError("Unable to find path to job");
            }

            subJobs.push(new MoveToJob(path));
        }

        subJobs.push(new _ChopTreeJob(this.tile));
        this.setJobs(subJobs);
    }
}

class _ChopTreeJob extends Job {
    private tile: GroundTile;
    private startTick = 0;
    private blinkingAnimation: BlinkingImageAnimation;

    constructor(tile: GroundTile) {
        super();
        this.tile = tile;
        this.blinkingAnimation = new BlinkingImageAnimation({
            x: 0,
            y: 0,
            image: "swipe_effect",
        });
    }

    update(tick: number): void {
        if (this.startTick == 0) {
            this.startTick = tick;
        }

        const elapsedTicks = tick - this.startTick;
        if (elapsedTicks > 2) {
            this.tile.hasTree = false;
            console.log("_ChopTreeJob finished");
            this.actor.world.actors.addActor(
                new CoinActor({ x: this.tile.tileX, y: this.tile.tileY })
            );
            this.complete();
        }
    }

    onDraw(renderContext: RenderContext) {
        const worldSpacePosition = renderContext.camera.tileSpaceToWorldSpace({
            x: this.tile.tileX,
            y: this.tile.tileY,
        });

        this.blinkingAnimation.updatePosition({
            x: worldSpacePosition.x,
            y: worldSpacePosition.y,
        });

        this.blinkingAnimation.onDraw(renderContext);
    }

    private spawnCoin() {
        this.actor.world.actors.addActor;
    }
}

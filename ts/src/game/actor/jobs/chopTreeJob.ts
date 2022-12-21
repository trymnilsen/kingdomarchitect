import { isPointAdjacentTo, pointEquals } from "../../../common/point";
import { RenderContext } from "../../../rendering/renderContext";
import { BlinkingImageAnimation } from "../../../rendering/visual/blinkingImageAnimation";
import { GroundTile } from "../../entity/ground";
import { TileSize } from "../../entity/tile";
import { CoinActor } from "../actors/coinActor";
import { isFarmerJobConstraint } from "../job/constraint/isFarmerActorConstraint";
import { Job } from "../job/job";
import { JobConstraintsError } from "../job/jobConstraintsError";
import { MultipleStepJob } from "../job/multipleStepJob";
import { MoveJob } from "./moveJob";

/**
 * Represents a multistep job that will move towards a tree and then chop
 * it down. If the tree is adjacent to the actor doing it, the moving part will
 * be skipped.
 */
export class ChopTreeJob extends MultipleStepJob {
    private _tile: GroundTile;

    public get groundTile(): GroundTile {
        return this._tile;
    }

    constructor(tree: GroundTile) {
        super(isFarmerJobConstraint);
        this._tile = tree;
    }

    override onStart(): void {
        // If the tree is next to us we just push the chop job
        // if the tree is not next to us we also push a move to job
        const tilePosition = { x: this._tile.tileX, y: this._tile.tileY };
        const subJobs: Job[] = [];
        if (!isPointAdjacentTo(tilePosition, this.actor.tilePosition)) {
            //The tile was not adjacent to us so we need to move to it first
            const pathResult = this.actor.world.findPath(
                this.actor.tilePosition,
                tilePosition
            );
            const path = pathResult.path;
            // The pathfinding will return the selected tile as a position to
            // walk to as well. To avoid ending on top of the tree to chop, we
            // pop the path removing the last position (position of the tree)
            if (pointEquals(tilePosition, path[path.length - 1])) {
                path.pop();
            }

            if (path.length == 0) {
                throw new JobConstraintsError("Unable to find path to job");
            }

            subJobs.push(new MoveJob(path));
        }

        subJobs.push(new _ChopTreeJob(this._tile));
        this.setJobs(subJobs);
    }

    override onDraw(renderContext: RenderContext): void {
        let visualPosition = renderContext.camera.tileSpaceToWorldSpace({
            x: this._tile.tileX,
            y: this._tile.tileY,
        });

        renderContext.drawRectangle({
            x: visualPosition.x + 4,
            y: visualPosition.y + 4,
            height: TileSize - 10,
            width: TileSize - 10,
            strokeColor: "yellow",
            strokeWidth: 2,
        });

        super.onDraw(renderContext);
    }
}

class _ChopTreeJob extends Job {
    private tile: GroundTile;
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
        const elapsedTicks = tick - this.startTick;
        console.log("Chop tree job update, tick:", tick, this.startTick);
        if (elapsedTicks > 2) {
            this.tile.hasTree = 0.0;
            console.log("_ChopTreeJob finished");
            this.actor.world.actors.addActor(
                new CoinActor({ x: this.tile.tileX, y: this.tile.tileY })
            );
            this.complete();
        }
    }

    override onDraw(renderContext: RenderContext) {
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
}

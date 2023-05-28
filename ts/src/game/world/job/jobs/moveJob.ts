import { Point } from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { TileSize } from "../../tile/tile";
import { Job } from "../job";
import { JobConstraint } from "../jobConstraint";

/**
 * Represents a job that will move through a specific path and complete once
 * the actor of this job is at the end of the path
 */
export class MoveJob extends Job {
    private path: Point[];

    constructor(path: Point[], constraint?: JobConstraint) {
        super(constraint);
        this.path = path.reverse();
    }

    update(tick: number): void {
        const newPosition = this.path.pop();
        if (newPosition) {
            this.entity.worldPosition = newPosition;
        } else {
            this.complete();
        }
    }

    override onDraw(renderContext: RenderContext): void {
        for (const pathPoint of this.path) {
            renderContext.drawRectangle({
                x: pathPoint.x * TileSize + 14,
                y: pathPoint.y * TileSize + 14,
                width: 8,
                height: 8,
                fill: "purple",
            });
        }
    }
}
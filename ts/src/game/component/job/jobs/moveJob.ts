import { Point } from "../../../../common/point.js";
import { RenderScope } from "../../../../rendering/renderScope.js";
import { Entity } from "../../../entity/entity.js";
import { TileSize } from "../../../map/tile.js";
import { IsInstanceJobConstraint } from "../constraint/isInstanceJobConstraint.js";
import { Job } from "../job.js";
import { JobConstraint } from "../jobConstraint.js";

/**
 * Represents a job that will move through a specific path and complete once
 * the actor of this job is at the end of the path
 */
export class MoveJob extends Job {
    constructor(
        private path: Point[],
        entity: Entity,
    ) {
        super([new IsInstanceJobConstraint(entity)]);
    }

    update(): void {
        const newPosition = this.path.pop();
        if (newPosition) {
            this.entity.worldPosition = newPosition;
        } else {
            this.complete();
        }
    }

    override onDraw(renderContext: RenderScope): void {
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

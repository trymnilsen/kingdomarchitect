import { randomEntry } from "../../../../common/array.js";
import { Direction, allDirections } from "../../../../common/direction.js";
import { Point, shiftPoint } from "../../../../common/point.js";
import { Job } from "../../job/job.js";
import { TilesComponent } from "../../tile/tilesComponent.js";
import { SpatialChunkMapComponent } from "../../world/spatialChunkMapComponent.js";

export class LookForFoodJob extends Job {
    private direction: Direction = Direction.Down;
    override onStart(): void {
        //Get directions that can be walked towards
        const applicableDirections = allDirections.filter((direction) => {
            const positionInDirection = shiftPoint(
                this.entity.worldPosition,
                direction,
                1,
            );

            return this.isPositionAvailable(positionInDirection);
        });
        if (applicableDirections.length > 0) {
            const randomDirection = randomEntry(applicableDirections);
            if (randomDirection) {
                this.direction = randomDirection;
            }
        }
    }

    override update(): void {
        const nextPosition = shiftPoint(
            this.entity.worldPosition,
            this.direction,
            1,
        );

        const isPointAvailable = this.isPositionAvailable(nextPosition);
        if (isPointAvailable) {
            this.entity.worldPosition = nextPosition;
        } else {
            this.complete();
        }
    }

    private isPositionAvailable(point: Point): boolean {
        const rootEntity = this.entity.getRootEntity();
        const tileComponent = rootEntity.requireComponent(TilesComponent);

        const hasTile = tileComponent.getTile(point);
        if (!hasTile) {
            return false;
        }

        const entities = rootEntity
            .requireComponent(SpatialChunkMapComponent)
            .getEntitiesAt(point.x, point.y);
        const hasNoEntities = entities.length == 0;

        return hasNoEntities;
    }
}

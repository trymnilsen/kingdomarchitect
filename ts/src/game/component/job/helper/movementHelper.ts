import {
    Point,
    isPointAdjacentTo,
    pointEquals,
} from "../../../../common/point.js";
import { Entity } from "../../../entity/entity.js";
import { PathFindingComponent } from "../../root/path/pathFindingComponent.js";

export class MovementHelper {
    private _entity: Entity | null = null;
    private _currentMovement: PathMovement | null = null;

    public get currentMovement(): PathMovement | null {
        return this._currentMovement;
    }

    public set currentMovement(v: PathMovement | null) {
        this._currentMovement = v;
    }

    public get entity(): Entity {
        if (!this._entity) {
            throw new Error("Entity is not set for movement helper");
        }

        return this._entity;
    }

    public set entity(v: Entity) {
        this._entity = v;
    }

    /**
     * Move towards the given target on step at the time. Will use the A* search
     * to look for an appropriate path. Caches the path and target and will
     * reuse this for future calls to path towards if the target is the same
     * @param target the final point the job should move towards
     * @param stopAtAdjacent stop on top of the target or next to it
     * @returns true if a movement was made, false if there was nowhere to go (
     * for example if the entity is stuck, adjacent or on top of the target)
     */
    public pathTowards(target: Point, stopAtAdjacent: boolean = true): boolean {
        if (
            !!this._currentMovement &&
            pointEquals(target, this._currentMovement.target)
        ) {
            // Check if the trailing edge of the path is adjacent to
            // the current position, in that case we can continue to use the
            // path currently generated
            const path = this._currentMovement.path;
            const trailingEdge = path[path.length - 1];
            if (!isPointAdjacentTo(trailingEdge, this.entity.worldPosition)) {
                // The world position has moved and is not adjacent to our
                // trailing edge we should regenerate the path to the target
                this.generatePath(
                    this.entity.worldPosition,
                    target,
                    stopAtAdjacent
                );
            }
        } else {
            // There is no path, generate movement
            this.generatePath(
                this.entity.worldPosition,
                target,
                stopAtAdjacent
            );
        }

        // Take the backward most path and move to it
        const nextStep = this._currentMovement?.path?.pop();
        if (nextStep) {
            this.entity.worldPosition = nextStep;
            return true;
        } else {
            // Reset the current movement as there is no more steps in the
            // path for it
            this._currentMovement = null;
            return false;
        }
    }

    private generatePath(
        start: Point,
        target: Point,
        removeTargetPoint: boolean
    ): Point[] {
        const pathComponent = this.entity
            .getRootEntity()
            .requireComponent(PathFindingComponent);

        const pathingResult = pathComponent.findPath(start, target);
        const reversePath = pathingResult.path.reverse();

        this._currentMovement = {
            target: target,
            path: reversePath,
        };

        return pathingResult.path;
    }
}

export type PathMovement = {
    target: Point;
    path: Point[];
};

import {
    Point,
    isPointAdjacentTo,
    pointEquals,
} from "../../../common/point.js";
import { EntityComponent } from "../entityComponent.js";
import { PathFindingComponent } from "../root/path/pathFindingComponent.js";
import {
    CurrentMovement,
    CurrentMovementUpdatedEvent,
} from "./currentMovement.js";
import { MovementResult } from "./movementResult.js";

type MovementBundle = {
    currentMovement: CurrentMovement;
};

export class MovementComponent extends EntityComponent<MovementBundle> {
    private _currentMovement: CurrentMovement = null;
    /**
     * The concept of shuffling is to "move out of the way". Another actor or
     * movement component can request that actors it considers in the way to
     * move. The movement component on the actor being asked to move will
     * then check for available space to move out of the way to. This is first
     * performed perpendicular to the incomming movement, otherwise movement in
     * same direction is checked, but this yields a higher weight. If there is
     * no way to move to, a weight of 0 is returned.
     * @returns 0 if shuffling is not possible, otherwise the weight to shuffle
     */
    shuffle(): number {
        return 0.0;
    }

    /**
     * Attempt to move towards the given target position. Will attempt to run
     * a pathsearch towards the target to get the steps to performed.
     * The search result will be cached as the current movement, if pathTo is
     * called multiple times with same target value.
     *
     * This method does not automatically move the actor closer to the target
     * on update, but moves it one step at a time for each invocation. It is up
     * to the calling code to consistently call this method.
     *
     * Will check for available energy before moving
     *
     * @param target
     * @param allowPartialPaths
     * @returns
     */
    pathTo(target: Point, _allowPartialPaths: boolean = false): MovementResult {
        if (pointEquals(target, this.entity.worldPosition)) {
            return MovementResult.AtPoint;
        }

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
                this.generatePath(this.entity.worldPosition, target);
            }
        } else {
            // There is no path, generate movement
            this.generatePath(this.entity.worldPosition, target);
        }

        // Take the backward most path and move to it
        const nextStep = this._currentMovement?.path?.pop();
        if (nextStep) {
            this.entity.worldPosition = nextStep;
            return MovementResult.Ok;
        } else {
            // Reset the current movement as there is no more steps in the
            // path for it
            this._currentMovement = null;
            return MovementResult.AtPoint;
        }
    }

    private generatePath(start: Point, target: Point): Point[] {
        const pathComponent = this.entity
            .getRootEntity()
            .requireComponent(PathFindingComponent);

        const pathingResult = pathComponent.findPath(start, target);
        const reversePath = pathingResult.path.reverse();

        this.setCurrentMovement({
            target: target,
            path: reversePath,
        });

        return pathingResult.path;
    }

    private setCurrentMovement(movement: CurrentMovement) {
        this._currentMovement = movement;
        this.publishEvent(new CurrentMovementUpdatedEvent(movement, this));
    }

    override fromComponentBundle(bundle: MovementBundle): void {
        this._currentMovement = bundle.currentMovement;
    }
    override toComponentBundle(): MovementBundle {
        return {
            currentMovement: this._currentMovement,
        };
    }
}

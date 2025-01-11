import {
    Point,
    getDirection,
    isPointAdjacentTo,
    manhattanDistance,
    pointEquals,
} from "../../../common/point.js";
import { PathOptions } from "../../../path/pathOptions.js";
import { SpriteAction } from "../draw/spriteProvider/statemachine/spriteAction.js";
import { SpriteStateMachine } from "../draw/spriteProvider/statemachine/spriteStateMachine.js";
import { EnergyComponent } from "../energy/energyComponent.js";
import { EntityComponent } from "../entityComponent.js";
import { PathFindingComponent } from "../root/path/pathFindingComponent.js";
import { getWeightAtPoint } from "../root/path/weight.js";
import { TilesComponent } from "../tile/tilesComponent.js";
import {
    CurrentMovement,
    CurrentMovementUpdatedEvent,
} from "./currentMovement.js";
import { MovementResult } from "./movementResult.js";

export class MovementComponent extends EntityComponent {
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
     * @param allow
     * @param allowPartialPaths
     * @returns
     */
    pathTo(
        target: Point,
        allowAdjacent: boolean = true,
        _allowPartial: boolean = true,
    ): MovementResult {
        if (pointEquals(target, this.entity.worldPosition)) {
            this._currentMovement = null;
            return MovementResult.AtPoint;
        }

        if (
            allowAdjacent &&
            manhattanDistance(this.entity.worldPosition, target) <= 2 &&
            isPointAdjacentTo(this.entity.worldPosition, target)
        ) {
            this._currentMovement = null;
            return MovementResult.AtPoint;
        }

        // Check if the target of the current movement is the same as this
        // requested target
        if (
            !!this._currentMovement &&
            this._currentMovement.path.length > 0 &&
            pointEquals(target, this._currentMovement.target)
        ) {
            // check if the trailing edge of the path is adjacent to
            // the current position, in that case we can continue to use the
            // path currently generated. If its not adjacent we need to generate
            // a new path
            const path = this._currentMovement.path;
            const trailingEdge = path[path.length - 1];
            if (!isPointAdjacentTo(trailingEdge, this.entity.worldPosition)) {
                // The world position has moved and is not adjacent to our
                // trailing edge we should regenerate the path to the target
                this.generatePath(this.entity.worldPosition, target);
            }
        } else {
            // There is no current movement or its not applicable for the target
            // generate a new one
            this.generatePath(this.entity.worldPosition, target);
        }

        // Check if the generated movement has no path left
        if (!!this._currentMovement && this._currentMovement.path.length == 0) {
            this._currentMovement = null;
            return MovementResult.NoPath;
        }

        // Check if there is enough energy
        const energyComponent = this.entity.requireComponent(EnergyComponent);
        if (energyComponent.energy >= 10) {
            energyComponent.decrementEnergy(10);
        } else {
            return MovementResult.NotEnoughEnergy;
        }

        // Take the backward most path and move to it
        const nextStep = this._currentMovement?.path?.pop();
        if (nextStep) {
            const isPositionAvailable = this.isPositionAvailable(nextStep);
            if (isPositionAvailable) {
                const direction = getDirection(
                    this.entity.worldPosition,
                    nextStep,
                );
                this.entity.worldPosition = nextStep;
                if (direction) {
                    const component =
                        this.entity.getComponent(SpriteStateMachine);
                    if (component) {
                        component.setState({
                            direction: direction,
                            action: SpriteAction.Move,
                        });
                    }
                }

                return MovementResult.Ok;
            } else {
                const newPath = this.generatePath(
                    this.entity.worldPosition,
                    target,
                );

                if (newPath.length == 0) {
                    return MovementResult.NoPath;
                } else {
                    return MovementResult.Obstructed;
                }
            }
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

    private isPositionAvailable(point: Point): boolean {
        const rootEntity = this.entity.getRootEntity();
        const tileComponent = rootEntity.requireComponent(TilesComponent);
        const weightAt = getWeightAtPoint(point, rootEntity, tileComponent);

        const tile = tileComponent.getTile(point);

        return weightAt > 0 && !!tile;
    }

    private setCurrentMovement(movement: CurrentMovement) {
        this._currentMovement = movement;
        this.publishEvent(new CurrentMovementUpdatedEvent(movement, this));
    }
}

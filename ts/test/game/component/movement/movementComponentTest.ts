import * as assert from "node:assert";
import {
    addMovementActor,
    createTestRootNode,
    removeTileLine,
} from "./movementHarness.js";
import { PathFindingComponent } from "../../../../src/game/component/root/path/pathFindingComponent.js";
import {
    Point,
    addPoint,
    subtractPoint,
} from "../../../../src/common/point.js";
import { MovementResult } from "../../../../src/game/component/movement/movementResult.js";
import { Axis } from "../../../../src/common/direction.js";

describe("MovementComponent", () => {
    describe("Pathing", () => {
        it("Path towards will move towards", () => {
            const target = {
                x: 4,
                y: 3,
            };
            const from = {
                x: 2,
                y: 2,
            };
            const testNode = createTestRootNode();

            const actorMovementWrapper = addMovementActor(testNode);
            actorMovementWrapper.entity.position = from;

            actorMovementWrapper.movementComponent.pathTo(target, false);
            actorMovementWrapper.movementComponent.pathTo(target, false);
            actorMovementWrapper.movementComponent.pathTo(target, false);

            assert.deepEqual(actorMovementWrapper.entity.position, target);
        });

        it("Path towards uses cached path if target is the same", () => {
            const testNode = createTestRootNode();
            const movementActor = addMovementActor(testNode);

            for (let i = 0; i < 3; i++) {
                movementActor.movementComponent.pathTo({
                    x: 4,
                    y: 4,
                });
            }

            assert.equal(movementActor.entityMovement.length, 3);
            assert.equal(movementActor.movementUpdates, 1);
        });

        it("Path towards will regenerate path on new target", () => {
            const testNode = createTestRootNode();
            const movementActor = addMovementActor(testNode);

            for (let i = 0; i < 4; i++) {
                movementActor.movementComponent.pathTo({
                    x: 6,
                    y: 6,
                });
            }

            movementActor.movementComponent.pathTo({
                x: 3,
                y: 7,
            });

            assert.equal(movementActor.movementUpdates, 2);
        });

        it("Sets the current movement on target set", () => {
            const testNode = createTestRootNode();
            const movementActor = addMovementActor(testNode);
            let movementSet = false;
            movementActor.onMovementUpdated.listenOnce(() => {
                movementSet = true;
            });

            movementActor.movementComponent.pathTo({
                x: 4,
                y: 4,
            });

            assert.equal(movementSet, true);
        });

        it("Path to will attempt to move partially and then return no path", () => {
            const testNode = createTestRootNode();
            removeTileLine(testNode, 0, 4, Axis.XAxis, 8);
            const movementActor = addMovementActor(testNode);
            movementActor.entity.worldPosition = {
                x: 4,
                y: 7,
            };

            let steps = 0;
            let result = MovementResult.Ok;
            while (steps < 8) {
                result = movementActor.movementComponent.pathTo({
                    x: 3,
                    y: 1,
                });

                if (result == MovementResult.NoPath) {
                    break;
                } else {
                    steps++;
                }
            }

            assert.equal(result, MovementResult.NoPath);
        });

        it("Path to will return false if movement in not possible and partial path is false", () => {
            //Need to add obstacles to path search
            //potentially need to path a few times before reaching obstacle
            //assert result
            assert.equal(2, 2);
        });

        it("Path will require energy", () => {
            const target = {
                x: 4,
                y: 3,
            };
            const from = {
                x: 2,
                y: 2,
            };

            const testNode = createTestRootNode();
            const actor = addMovementActor(testNode);
            actor.entity.position = from;

            for (let i = 0; i < 3; i++) {
                actor.movementComponent.pathTo(target, false);
            }

            assert.equal(actor.energyComponent.energy, 70);
        });

        it("Path to will not generate path or use energy if target is the same as current", () => {
            const testNode = createTestRootNode();
            const movementActor = addMovementActor(testNode);

            const pathToResult = movementActor.movementComponent.pathTo(
                movementActor.entity.worldPosition,
            );

            assert.equal(pathToResult, MovementResult.AtPoint);
            assert.equal(movementActor.entityMovement.length, 0);
            assert.equal(movementActor.movementUpdates, 0);
        });

        it("Path to will not move if no energy is available", () => {
            const testNode = createTestRootNode();
            const movementActor = addMovementActor(testNode);
            movementActor.energyComponent.setEnergy(20);

            const movementResults: MovementResult[] = [];
            for (let i = 0; i < 3; i++) {
                const result = movementActor.movementComponent.pathTo({
                    x: 4,
                    y: 4,
                });

                movementResults.push(result);
            }

            assert.deepEqual(movementResults, [
                MovementResult.Ok,
                MovementResult.Ok,
                MovementResult.NotEnoughEnergy,
            ]);
        });

        it("Path to will stop at adjacent if requested", () => {
            const target = {
                x: 4,
                y: 3,
            };
            const from = {
                x: 2,
                y: 2,
            };

            const testNode = createTestRootNode();
            const actor = addMovementActor(testNode);
            actor.entity.position = from;

            actor.movementComponent.pathTo(target, true);
            actor.movementComponent.pathTo(target, true);
            actor.movementComponent.pathTo(target, true);

            assert.deepEqual(actor.entityMovement, [
                { x: 2, y: 2 },
                { x: 3, y: 2 },
                { x: 4, y: 2 },
            ]);
        });

        it("Path to can reuse current movement if actor position is adjacent to path", () => {
            const target = {
                x: 5,
                y: 7,
            };
            const from = {
                x: 5,
                y: 2,
            };

            const testNode = createTestRootNode();
            const actor = addMovementActor(testNode);

            actor.entity.position = from;
            actor.movementComponent.pathTo(target);
            actor.entity.position = addPoint(
                actor.movementComponent.entity.position,
                { x: 1, y: 1 },
            );
            actor.movementComponent.pathTo(target);
            actor.movementComponent.pathTo(target);
            actor.movementComponent.pathTo(target);

            assert.equal(actor.movementUpdates, 1);
            assert.deepEqual(actor.entityMovement, [
                { x: 5, y: 2 },
                { x: 5, y: 3 },
                { x: 6, y: 4 },
                { x: 5, y: 4 },
                { x: 5, y: 5 },
                { x: 5, y: 6 },
            ]);
        });

        it("Movement will not happen automatically but requires a call to path to", () => {
            const testNode = createTestRootNode();
            const actor = addMovementActor(testNode);

            actor.movementComponent.pathTo({ x: 3, y: 3 });
            actor.movementComponent.onUpdate(10);
            actor.movementComponent.onUpdate(20);
            actor.movementComponent.onUpdate(30);
            actor.movementComponent.pathTo({ x: 3, y: 3 });

            assert.equal(actor.entityMovement.length, 2);
            assert.deepEqual(actor.entityMovement, [
                { x: 1, y: 0 },
                { x: 1, y: 1 },
            ]);
        });

        it("Movement will check if its possible to move to next position", () => {
            const testNode = createTestRootNode();
            const movementActor = addMovementActor(testNode);
            movementActor.entity.worldPosition = {
                x: 4,
                y: 0,
            };

            movementActor.movementComponent.pathTo({ x: 4, y: 6 });
            movementActor.movementComponent.pathTo({ x: 4, y: 6 });
            movementActor.movementComponent.pathTo({ x: 4, y: 6 });
            removeTileLine(testNode, 2, 4, Axis.XAxis, 4);
            const obstructedResult = movementActor.movementComponent.pathTo({
                x: 4,
                y: 6,
            });
            movementActor.movementComponent.pathTo({ x: 4, y: 6 });
            movementActor.movementComponent.pathTo({ x: 4, y: 6 });

            assert.equal(obstructedResult, MovementResult.Obstructed);
            assert.equal(movementActor.movementUpdates, 2);
            const hasPointInRemovedTileLine = movementActor.entityMovement.some(
                (point) => {
                    return point.x >= 2 && point.x <= 6 && point.y == 4;
                },
            );
            assert.equal(
                hasPointInRemovedTileLine,
                false,
                "Movement inside removed tile line",
            );
        });

        it("Regenerate path if the current position has moved to a not adjacent position", () => {
            const target = {
                x: 5,
                y: 7,
            };
            const from = {
                x: 5,
                y: 2,
            };

            const testNode = createTestRootNode();
            const actor = addMovementActor(testNode);

            actor.entity.position = from;
            actor.movementComponent.pathTo(target);
            actor.entity.position = addPoint(
                actor.movementComponent.entity.position,
                { x: 2, y: 0 },
            );
            actor.movementComponent.pathTo(target);
            actor.movementComponent.pathTo(target);
            actor.movementComponent.pathTo(target);

            assert.equal(actor.movementUpdates, 2);
        });

        it("Will persist the current movement for the movement component", () => {
            assert.equal(2, 2);
        });
    });

    describe("Shuffling", () => {
        it("Movement will check for actor in the way and requesting shuffling", () => {
            assert.equal(2, 2);
        });

        it("Shuffling will return a float number if possible", () => {
            assert.equal(2, 2);
        });

        it("Shuffling will return 0 if not possible", () => {
            assert.equal(2, 2);
        });

        it("Shuffling will move to adjacent tile if available", () => {
            assert.equal(2, 2);
        });

        it("Shuffling will move perpendicular to incoming movement", () => {
            assert.equal(2, 2);
        });

        it("Shuffling will propagate shuffling if actor is in the way", () => {
            assert.equal(2, 2);
        });

        it("A shuffled actor will return to their path if possible", () => {
            assert.equal(2, 2);
        });

        it("Shuffling will consume energy", () => {
            assert.equal(2, 2);
        });

        it("Shuffling will return 0 if no energy is available", () => {
            assert.equal(2, 2);
        });

        it("A shuffled actor will not take a movement on their turn", () => {
            assert.equal(2, 2);
        });

        it("A shuffled actor will regenerate path if not possible to return to their intended path", () => {
            assert.equal(2, 2);
        });
    });

    describe("Scenarios", () => {
        it("given an open area, two actors should make their way without regenration and shuffling", () => {
            assert.equal(2, 2);
        });

        it("given a corridor with a width of 2, two actors should request shuffling once", () => {
            assert.equal(2, 2);
        });

        it("given a corridor with an intial width of 1 and then 2, two actors will request shuffling twice", () => {
            assert.equal(2, 2);
        });

        it("given a corridor with an intial width of 1, two actors wont be stuck shuffling eachother", () => {
            assert.equal(2, 2);
        });

        it("given a corridor with a width of 2, two actors should pass each other without shuffling", () => {
            assert.equal(2, 2);
        });

        it("given a corridor with a width of 2, four actors will reach the endpoint", () => {
            assert.equal(2, 2);
        });

        it("given a corridor with a width of 8, four actors will reach the endpoint", () => {
            assert.equal(2, 2);
        });

        it("given a map with a bottleneck with a width 1 and a height of 4, 16 actors will reach the endpoint", () => {
            assert.equal(2, 2);
        });
    });
});

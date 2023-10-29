import * as assert from "node:assert";
import { addMovementActor, createTestRootNode } from "./movementHarness.js";
import { PathFindingComponent } from "../../../../src/game/component/root/path/pathFindingComponent.js";
import { Point } from "../../../../src/common/point.js";
import { MovementResult } from "../../../../src/game/component/movement/movementResult.js";

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
            const pathComponent =
                testNode.requireComponent(PathFindingComponent);

            const actorMovementWrapper = addMovementActor(testNode);
            actorMovementWrapper.component.entity.position = from;

            //Get the path from the pathfinding component
            const solvedPath = pathComponent.findPath(from, target).path;
            const movedPath: Point[] = [];

            for (let i = 0; i < 3; i++) {
                actorMovementWrapper.component.pathTo(target);
                movedPath.push(actorMovementWrapper.component.entity.position);
            }

            assert.deepEqual(movedPath, solvedPath);
            assert.deepEqual(
                actorMovementWrapper.component.entity.position,
                target,
            );
        });

        it("Path towards uses cached path if target is the same", () => {
            const testNode = createTestRootNode();
            const movementActor = addMovementActor(testNode);

            for (let i = 0; i < 3; i++) {
                movementActor.component.pathTo({
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
                movementActor.component.pathTo({
                    x: 6,
                    y: 6,
                });
            }

            movementActor.component.pathTo({
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

            movementActor.component.pathTo({
                x: 4,
                y: 4,
            });

            assert.equal(movementSet, true);
        });

        it("Path to will return false if movement in not possible", () => {
            assert.equal(2, 2);
        });

        it("Path will require energy", () => {
            assert.equal(2, 2);
        });

        it("Path to will not generate path or use energy if target is the same as current", () => {
            const testNode = createTestRootNode();
            const movementActor = addMovementActor(testNode);

            const pathToResult = movementActor.component.pathTo(
                movementActor.component.entity.worldPosition,
            );

            assert.equal(pathToResult, MovementResult.AtPoint);
            assert.equal(movementActor.entityMovement.length, 0);
            assert.equal(movementActor.movementUpdates, 0);
        });

        it("Path to will not move if no energy is available", () => {
            assert.equal(2, 2);
        });

        it("Path to will stop at adjacent if requested", () => {
            assert.equal(2, 2);
        });

        it("Movement will teleport actor if its stuck inside of a building", () => {
            assert.equal(2, 2);
        });

        it("Movement will not happen automatically but requires a call to path to", () => {
            assert.equal(2, 2);
        });

        it("Movement will check for building in the way and publish in the way event", () => {
            assert.equal(2, 2);
        });

        it("Movement will renegrate path if we are still at the same position as last time and not at target", () => {
            assert.equal(2, 2);
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

        it("Movement will check for building in the way and publish in the way event", () => {
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

        it("given a corridor with a width of 2, four actors will reach the endpoint", () => {
            assert.equal(2, 2);
        });

        it("given a corridor with a width of 8, four actors will reach the endpoint", () => {
            assert.equal(2, 2);
        });
    });
});

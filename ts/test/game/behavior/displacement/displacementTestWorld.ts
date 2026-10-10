import { EcsWorld } from "../../../../src/ecs/ecsWorld.ts";
import { chunkMapSystem } from "../../../../src/game/system/chunkMapSystem.ts";
import { createTileComponent } from "../../../../src/game/component/tileComponent.ts";
import { addGroundCovering, wallOff } from "../../testWorld.ts";
import { createChunkMapComponent } from "../../../../src/game/component/chunkMapComponent.ts";
import { createPathfindingGraphComponent } from "../../../../src/game/component/pathfindingGraphComponent.ts";
import { createLazyGraphFromRootNode } from "../../../../src/game/map/path/graph/generateGraph.ts";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createBehaviorAgentComponent,
    getBehaviorAgent,
} from "../../../../src/game/component/behaviorAgentComponent.ts";
import { createMovementStaminaComponent } from "../../../../src/game/component/movementStaminaComponent.ts";
import { createSpriteComponent } from "../../../../src/game/component/spriteComponent.ts";
import { createBuildingComponent } from "../../../../src/game/component/buildingComponent.ts";
import { nullBuilding } from "../../../../src/data/building/building.ts";
import type { SpriteRef } from "../../../../src/asset/sprite.ts";
import type { Point } from "../../../../src/common/point.ts";

const testSprite: SpriteRef = { bin: "test", spriteId: "test" };

export const testWorldBounds = { x1: 8, y1: 8, x2: 31, y2: 15 };

/**
 * Open ground over x=8..31, y=8..15, ringed by walls, with a pathfinding graph.
 * Row y=7 is wall, which the tests use as the north side of a corridor.
 */
export function createTestWorld(): { root: Entity } {
    const ecsWorld = new EcsWorld();
    ecsWorld.addSystem(chunkMapSystem);
    const root = ecsWorld.root;

    const tileComponent = createTileComponent();
    addGroundCovering(tileComponent, testWorldBounds);
    root.setEcsComponent(tileComponent);
    root.setEcsComponent(createChunkMapComponent());
    root.setEcsComponent(
        createPathfindingGraphComponent(createLazyGraphFromRootNode(root)),
    );
    wallOff(root, testWorldBounds);

    return { root };
}

/**
 * A settled agent. A fresh agent carries pendingReplan, which makes it
 * transient, so it is cleared here and tests that want an undecided agent set
 * it again.
 */
export function createAgent(
    id: string,
    root: Entity,
    x: number,
    y: number,
    utility: number = 0,
): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(testSprite));
    entity.setEcsComponent(createBehaviorAgentComponent());
    entity.setEcsComponent(createMovementStaminaComponent());
    const agent = getBehaviorAgent(entity)!;
    agent.currentBehaviorUtility = utility;
    agent.pendingReplan = undefined;
    root.addChild(entity);
    entity.worldPosition = { x, y };
    return entity;
}

/**
 * An agent partway along `path`, which ends at its target. Every walker has the
 * same utility, so rank never decides between them.
 */
export function createWalker(
    id: string,
    root: Entity,
    x: number,
    y: number,
    path: Point[],
): Entity {
    const walker = createAgent(id, root, x, y, 5);
    getBehaviorAgent(walker)!.actionQueue = [
        { type: "moveTo", target: path[path.length - 1], cachedPath: path },
    ];
    return walker;
}

export function createWall(
    id: string,
    root: Entity,
    x: number,
    y: number,
): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(testSprite));
    entity.setEcsComponent(createBuildingComponent(nullBuilding, false));
    root.addChild(entity);
    entity.worldPosition = { x, y };
    return entity;
}

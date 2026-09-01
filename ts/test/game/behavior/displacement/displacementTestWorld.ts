import { EcsWorld } from "../../../../src/ecs/ecsWorld.ts";
import { chunkMapSystem } from "../../../../src/game/system/chunkMapSystem.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../../src/game/component/tileComponent.ts";
import { createChunkMapComponent } from "../../../../src/game/component/chunkMapComponent.ts";
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

const testSprite: SpriteRef = { bin: "test", spriteId: "test" };

/**
 * World covering world tiles x=8..23, y=8..15.
 * Tiles at y=7 (north of row y=8) fall outside any chunk and score -Infinity,
 * acting as natural walls. Tiles at y=9 and beyond (inside the chunk) are
 * valid ground unless explicitly blocked with a building entity.
 */
export function createTestWorld(): { root: Entity } {
    const ecsWorld = new EcsWorld();
    ecsWorld.addSystem(chunkMapSystem);
    const root = ecsWorld.root;

    const tileComponent = createTileComponent();
    setChunk(tileComponent, { chunkX: 1, chunkY: 1 });
    setChunk(tileComponent, { chunkX: 2, chunkY: 1 });
    root.setEcsComponent(tileComponent);
    root.setEcsComponent(createChunkMapComponent());

    return { root };
}

/**
 * A settled agent at the given tile, carrying the stamina component commit
 * needs to record a move.
 *
 * A freshly created agent carries pendingReplan, which would classify it as
 * transient and so waited for rather than displaced. These tests model
 * committed blockers, so it is cleared here. The transient cases set it, or a
 * moveTo, explicitly.
 *
 * worldPosition is set after addChild so the parent transform exists.
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
 * An agent with no MovementStaminaComponent, for the case where a commit has
 * nowhere to record the move it just made.
 */
export function createAgentWithoutStamina(
    id: string,
    root: Entity,
    x: number,
    y: number,
): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createSpriteComponent(testSprite));
    entity.setEcsComponent(createBehaviorAgentComponent());
    root.addChild(entity);
    entity.worldPosition = { x, y };
    return entity;
}

/**
 * An impassable building at a tile, to block displacement paths. Its id is not
 * "road", so scoreCandidateTile returns -Infinity for the tile.
 */
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

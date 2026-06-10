import assert from "node:assert";
import { describe, it } from "node:test";
import { chebyshevDistance } from "../../../src/common/point.ts";
import { goblinCampfire } from "../../../src/data/building/goblin/goblinCampfire.ts";
import { goblinHut } from "../../../src/data/building/goblin/goblinHut.ts";
import { createBuildingComponent } from "../../../src/game/component/buildingComponent.ts";
import { createChunkMapComponent } from "../../../src/game/component/chunkMapComponent.ts";
import {
    createTileComponent,
    setChunk,
} from "../../../src/game/component/tileComponent.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    CAMPFIRE_CLEARANCE_RADIUS,
    createCampBuildingPlacementValidator,
} from "../../../src/game/camp/campBuildingPlacement.ts";
import { findClosestAvailablePosition } from "../../../src/game/map/query/closestPositionQuery.ts";
import type { Building } from "../../../src/data/building/building.ts";

/**
 * Creates a root entity with ground registered for chunk (0,0) — world
 * positions 0–7 on both axes — and a camp entity anchored at (4,4).
 */
function createWorldWithCamp(): { root: Entity; camp: Entity } {
    const root = new Entity("root");
    const tileComponent = createTileComponent();
    setChunk(tileComponent, { chunkX: 0, chunkY: 0 });
    root.setEcsComponent(tileComponent);
    root.setEcsComponent(createChunkMapComponent());

    const camp = new Entity("camp-1");
    root.addChild(camp);
    camp.position = { x: 4, y: 4 };

    return { root, camp };
}

function addCampBuilding(
    camp: Entity,
    building: Building,
    worldPosition: { x: number; y: number },
    scaffolded: boolean = false,
): Entity {
    const entity = new Entity(
        `${building.id}-${worldPosition.x}-${worldPosition.y}`,
    );
    entity.setEcsComponent(createBuildingComponent(building, scaffolded));
    camp.addChild(entity);
    // addChild preserves the child's world position, so assign world
    // coordinates directly instead of a position relative to the camp.
    entity.worldPosition = worldPosition;
    return entity;
}

describe("createCampBuildingPlacementValidator", () => {
    describe("placing a non-campfire building", () => {
        it("rejects the campfire tile and every tile in its clearance ring", () => {
            const { root, camp } = createWorldWithCamp();
            // Campfire on the camp anchor, as in the real camp prefab
            addCampBuilding(camp, goblinCampfire, { x: 4, y: 4 });
            const validator = createCampBuildingPlacementValidator(
                root,
                camp,
                goblinHut,
            );

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const candidate = { x: 4 + dx, y: 4 + dy };
                    assert.strictEqual(
                        validator(candidate),
                        false,
                        `tile (${candidate.x},${candidate.y}) is within the campfire clearance ring`,
                    );
                }
            }
        });

        it("accepts a tile just outside the clearance ring", () => {
            const { root, camp } = createWorldWithCamp();
            addCampBuilding(camp, goblinCampfire, { x: 4, y: 4 });
            const validator = createCampBuildingPlacementValidator(
                root,
                camp,
                goblinHut,
            );

            assert.strictEqual(validator({ x: 6, y: 4 }), true);
            assert.strictEqual(validator({ x: 6, y: 6 }), true);
        });

        it("keeps clearance around scaffolded campfires too", () => {
            const { root, camp } = createWorldWithCamp();
            addCampBuilding(camp, goblinCampfire, { x: 4, y: 4 }, true);
            const validator = createCampBuildingPlacementValidator(
                root,
                camp,
                goblinHut,
            );

            assert.strictEqual(validator({ x: 5, y: 4 }), false);
            assert.strictEqual(validator({ x: 6, y: 4 }), true);
        });

        it("still applies the generic placement rules outside the ring", () => {
            const { root, camp } = createWorldWithCamp();
            addCampBuilding(camp, goblinCampfire, { x: 4, y: 4 });
            const validator = createCampBuildingPlacementValidator(
                root,
                camp,
                goblinHut,
            );

            // (20,4) is far from the fire but in an unregistered chunk:
            // no ground, so the generic building rules reject it.
            assert.strictEqual(validator({ x: 20, y: 4 }), false);
        });
    });

    describe("placing a campfire", () => {
        it("rejects tiles within the clearance ring of an existing camp building", () => {
            const { root, camp } = createWorldWithCamp();
            addCampBuilding(camp, goblinHut, { x: 6, y: 4 });
            const validator = createCampBuildingPlacementValidator(
                root,
                camp,
                goblinCampfire,
            );

            assert.strictEqual(validator({ x: 5, y: 4 }), false);
            assert.strictEqual(validator({ x: 5, y: 5 }), false);
            assert.strictEqual(validator({ x: 4, y: 4 }), true);
        });
    });

    describe("combined with findClosestAvailablePosition", () => {
        it("settles on the closest tile outside the campfire clearance ring", () => {
            const { root, camp } = createWorldWithCamp();
            const campfire = addCampBuilding(camp, goblinCampfire, {
                x: 4,
                y: 4,
            });

            // Search from the campfire tile, as camp expansion does.
            const position = findClosestAvailablePosition(
                root,
                campfire.worldPosition,
                createCampBuildingPlacementValidator(root, camp, goblinHut),
            );

            assert.ok(position, "a build position should be found");
            assert.strictEqual(
                chebyshevDistance(campfire.worldPosition, position),
                CAMPFIRE_CLEARANCE_RADIUS + 1,
                "the build position should sit just outside the clearance ring",
            );
        });
    });
});

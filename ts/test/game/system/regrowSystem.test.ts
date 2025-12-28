import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.js";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.js";
import {
    createRegrowComponent,
    RegrowComponentId,
} from "../../../src/game/component/regrowComponent.js";
import { berryBushResource } from "../../../src/data/inventory/items/naturalResource.js";
import { regrowSystem } from "../../../src/game/system/regrowSystem.js";
import { SpriteComponentId } from "../../../src/game/component/spriteComponent.js";
import { createSpriteComponent } from "../../../src/game/component/spriteComponent.js";
import { zeroPoint } from "../../../src/common/point.js";

describe("RegrowSystem", () => {
    function createBerryBush(root: Entity): Entity {
        const bush = new Entity("berry-bush");
        bush.setEcsComponent(createResourceComponent(berryBushResource.id));
        bush.setEcsComponent(
            createSpriteComponent(berryBushResource.asset, zeroPoint()),
        );
        bush.setEcsComponent(createRegrowComponent(berryBushResource.id));
        root.addChild(bush);
        return bush;
    }

    describe("Resource Regrowth", () => {
        it("does not affect resources that have never been harvested", () => {
            const root = new Entity("root");
            const bush = createBerryBush(root);

            const regrowComponent = bush.requireEcsComponent(RegrowComponentId);
            assert.strictEqual(
                regrowComponent.harvestedAtTick,
                -1,
                "Initial harvestedAtTick should be -1",
            );

            regrowSystem.onUpdate(root, 100);

            const updatedRegrowComponent =
                bush.requireEcsComponent(RegrowComponentId);
            assert.strictEqual(
                updatedRegrowComponent.harvestedAtTick,
                -1,
                "harvestedAtTick should remain -1 after system update",
            );
        });

        it("does not regrow resource before regrow time has passed", () => {
            const root = new Entity("root");
            const bush = createBerryBush(root);

            // Mark as harvested
            const harvestTick = 100;
            const regrowComponent = bush.requireEcsComponent(RegrowComponentId);
            regrowComponent.harvestedAtTick = harvestTick;
            bush.invalidateComponent(RegrowComponentId);

            // Run system before regrow time (200 ticks for berry bush)
            const beforeRegrowTick = harvestTick + 150;
            regrowSystem.onUpdate(root, beforeRegrowTick);

            const updatedRegrowComponent =
                bush.requireEcsComponent(RegrowComponentId);
            assert.strictEqual(
                updatedRegrowComponent.harvestedAtTick,
                harvestTick,
                "Should still be marked as harvested before regrow time",
            );
        });

        it("regrows resource after regrow time has passed", () => {
            const root = new Entity("root");
            const bush = createBerryBush(root);

            // Mark as harvested
            const harvestTick = 100;
            const regrowComponent = bush.requireEcsComponent(RegrowComponentId);
            regrowComponent.harvestedAtTick = harvestTick;
            bush.invalidateComponent(RegrowComponentId);

            // Run system after regrow time (200 ticks for berry bush)
            const afterRegrowTick = harvestTick + 200;
            regrowSystem.onUpdate(root, afterRegrowTick);

            const updatedRegrowComponent =
                bush.requireEcsComponent(RegrowComponentId);
            assert.strictEqual(
                updatedRegrowComponent.harvestedAtTick,
                -1,
                "Should be reset to -1 after regrow completes",
            );
        });

        it("regrows resource exactly at regrow time threshold", () => {
            const root = new Entity("root");
            const bush = createBerryBush(root);

            const harvestTick = 100;
            const regrowComponent = bush.requireEcsComponent(RegrowComponentId);
            regrowComponent.harvestedAtTick = harvestTick;
            bush.invalidateComponent(RegrowComponentId);

            // Run system exactly at regrow time
            const exactRegrowTick = harvestTick + 200;
            regrowSystem.onUpdate(root, exactRegrowTick);

            const updatedRegrowComponent =
                bush.requireEcsComponent(RegrowComponentId);
            assert.strictEqual(
                updatedRegrowComponent.harvestedAtTick,
                -1,
                "Should regrow at exact regrow time threshold",
            );
        });
    });

    describe("Sprite Updates", () => {
        it("changes sprite to depleted during regrow period", () => {
            const root = new Entity("root");
            const bush = createBerryBush(root);

            // Mark as harvested
            const harvestTick = 100;
            const regrowComponent = bush.requireEcsComponent(RegrowComponentId);
            regrowComponent.harvestedAtTick = harvestTick;
            bush.invalidateComponent(RegrowComponentId);

            // Run system during regrow period
            const duringRegrowTick = harvestTick + 50;
            regrowSystem.onUpdate(root, duringRegrowTick);

            const spriteComponent = bush.requireEcsComponent(SpriteComponentId);
            assert.strictEqual(
                spriteComponent.sprite,
                berryBushResource.lifecycle.sprite,
                "Sprite should be changed to depleted sprite",
            );
        });

        it("restores sprite to normal after regrow completes", () => {
            const root = new Entity("root");
            const bush = createBerryBush(root);

            // Mark as harvested
            const harvestTick = 100;
            const regrowComponent = bush.requireEcsComponent(RegrowComponentId);
            regrowComponent.harvestedAtTick = harvestTick;
            bush.invalidateComponent(RegrowComponentId);

            // Run system after regrow completes
            const afterRegrowTick = harvestTick + 200;
            regrowSystem.onUpdate(root, afterRegrowTick);

            const spriteComponent = bush.requireEcsComponent(SpriteComponentId);
            assert.strictEqual(
                spriteComponent.sprite,
                berryBushResource.asset,
                "Sprite should be restored to normal sprite",
            );
        });

        it("only updates sprite once to depleted state", () => {
            const root = new Entity("root");
            const bush = createBerryBush(root);

            const harvestTick = 100;
            const regrowComponent = bush.requireEcsComponent(RegrowComponentId);
            regrowComponent.harvestedAtTick = harvestTick;
            bush.invalidateComponent(RegrowComponentId);

            // Run system multiple times during regrow
            regrowSystem.onUpdate(root, harvestTick + 50);
            const sprite1 = bush.requireEcsComponent(SpriteComponentId).sprite;

            regrowSystem.onUpdate(root, harvestTick + 100);
            const sprite2 = bush.requireEcsComponent(SpriteComponentId).sprite;

            assert.strictEqual(
                sprite1,
                sprite2,
                "Sprite should remain depleted throughout regrow period",
            );
            assert.strictEqual(
                sprite1,
                berryBushResource.lifecycle.sprite,
                "Should be depleted sprite",
            );
        });
    });

    describe("Multiple Resources", () => {
        it("handles multiple resources with different harvest times", () => {
            const root = new Entity("root");
            const bush1 = createBerryBush(root);
            const bush2 = createBerryBush(root);

            // Harvest bush1 early, bush2 later
            const harvestTick1 = 100;
            const harvestTick2 = 200;

            bush1.requireEcsComponent(RegrowComponentId).harvestedAtTick =
                harvestTick1;
            bush1.invalidateComponent(RegrowComponentId);

            bush2.requireEcsComponent(RegrowComponentId).harvestedAtTick =
                harvestTick2;
            bush2.invalidateComponent(RegrowComponentId);

            // Run at time when bush1 should regrow but bush2 should not
            const midTick = harvestTick1 + 200;
            regrowSystem.onUpdate(root, midTick);

            const regrow1 = bush1.requireEcsComponent(RegrowComponentId);
            const regrow2 = bush2.requireEcsComponent(RegrowComponentId);

            assert.strictEqual(
                regrow1.harvestedAtTick,
                -1,
                "Bush1 should be regrown",
            );
            assert.strictEqual(
                regrow2.harvestedAtTick,
                harvestTick2,
                "Bush2 should still be harvested",
            );
        });

        it("regrowing resource can be harvested again", () => {
            const root = new Entity("root");
            const bush = createBerryBush(root);

            // First harvest cycle
            const harvestTick1 = 100;
            bush.requireEcsComponent(RegrowComponentId).harvestedAtTick =
                harvestTick1;
            bush.invalidateComponent(RegrowComponentId);

            // Wait for regrow
            regrowSystem.onUpdate(root, harvestTick1 + 200);

            let regrowComponent = bush.requireEcsComponent(RegrowComponentId);
            assert.strictEqual(
                regrowComponent.harvestedAtTick,
                -1,
                "Should be regrown after first cycle",
            );

            // Second harvest cycle
            const harvestTick2 = harvestTick1 + 250;
            bush.requireEcsComponent(RegrowComponentId).harvestedAtTick =
                harvestTick2;
            bush.invalidateComponent(RegrowComponentId);

            regrowComponent = bush.requireEcsComponent(RegrowComponentId);
            assert.strictEqual(
                regrowComponent.harvestedAtTick,
                harvestTick2,
                "Should be harvested again",
            );

            // Wait for second regrow
            regrowSystem.onUpdate(root, harvestTick2 + 200);

            regrowComponent = bush.requireEcsComponent(RegrowComponentId);
            assert.strictEqual(
                regrowComponent.harvestedAtTick,
                -1,
                "Should be regrown after second cycle",
            );
        });
    });

    describe("Edge Cases", () => {
        it("handles missing ResourceComponent gracefully", () => {
            const root = new Entity("root");
            const entity = new Entity("invalid");
            entity.setEcsComponent(createRegrowComponent(berryBushResource.id));
            entity.requireEcsComponent(RegrowComponentId).harvestedAtTick = 100;
            entity.invalidateComponent(RegrowComponentId);
            root.addChild(entity);

            // Should not throw
            assert.doesNotThrow(() => {
                regrowSystem.onUpdate(root, 300);
            });

            // Entity should still be harvested (no change)
            const regrowComponent =
                entity.requireEcsComponent(RegrowComponentId);
            assert.strictEqual(
                regrowComponent.harvestedAtTick,
                100,
                "Should remain unchanged",
            );
        });

        it("handles missing SpriteComponent gracefully", () => {
            const root = new Entity("root");
            const entity = new Entity("no-sprite");
            entity.setEcsComponent(
                createResourceComponent(berryBushResource.id),
            );
            entity.setEcsComponent(createRegrowComponent(berryBushResource.id));
            entity.requireEcsComponent(RegrowComponentId).harvestedAtTick = 100;
            entity.invalidateComponent(RegrowComponentId);
            root.addChild(entity);

            // Should not throw and should still process regrow
            assert.doesNotThrow(() => {
                regrowSystem.onUpdate(root, 300);
            });

            const regrowComponent =
                entity.requireEcsComponent(RegrowComponentId);
            assert.strictEqual(
                regrowComponent.harvestedAtTick,
                -1,
                "Should regrow despite missing sprite",
            );
        });
    });
});

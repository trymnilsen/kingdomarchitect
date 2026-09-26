import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.ts";
import {
    createRegrowComponent,
    RegrowComponentId,
} from "../../../src/game/component/regrowComponent.ts";
import { berryBushResource } from "../../../src/data/inventory/items/naturalResource.ts";
import { regrowSystem } from "../../../src/game/system/regrowSystem.ts";
import { SpriteComponentId } from "../../../src/game/component/spriteComponent.ts";
import { createSpriteComponent } from "../../../src/game/component/spriteComponent.ts";
import { zeroPoint } from "../../../src/common/point.ts";

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
        it("does not regrow resource before regrow time has passed", () => {
            const root = new Entity("root");
            const bush = createBerryBush(root);

            // Mark as harvested
            const harvestTick = 100;
            const regrowComponent = bush.requireEcsComponent(RegrowComponentId);
            regrowComponent.harvestedAtTick = harvestTick;
            bush.invalidateComponent(RegrowComponentId);

            // One tick short of the berry bush's 200 tick regrow time.
            const beforeRegrowTick = harvestTick + 199;
            regrowSystem.onUpdate(root, beforeRegrowTick);

            const updatedRegrowComponent =
                bush.requireEcsComponent(RegrowComponentId);
            assert.strictEqual(
                updatedRegrowComponent.harvestedAtTick,
                harvestTick,
                "Should still be marked as harvested before regrow time",
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
});

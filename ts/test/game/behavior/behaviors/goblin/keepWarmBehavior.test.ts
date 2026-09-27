import { describe, it } from "node:test";
import assert from "node:assert";
import { createKeepWarmBehavior } from "../../../../../src/game/behavior/behaviors/goblin/keepWarmBehavior.ts";
import { Entity } from "../../../../../src/game/entity/entity.ts";
import {
    createWarmthComponent,
    COLD_THRESHOLD,
} from "../../../../../src/game/component/warmthComponent.ts";
import { createGoblinUnitComponent } from "../../../../../src/game/component/goblinUnitComponent.ts";
import { createGoblinCampComponent } from "../../../../../src/game/component/goblinCampComponent.ts";
import { createFireSourceComponent } from "../../../../../src/game/component/fireSourceComponent.ts";
import { createBehaviorAgentComponent } from "../../../../../src/game/component/behaviorAgentComponent.ts";

function createTestGoblin(
    warmth: number = 80,
    campEntityId: string = "camp-1",
): Entity {
    const entity = new Entity("goblin-1");
    entity.setEcsComponent(createWarmthComponent(warmth));
    entity.setEcsComponent(createGoblinUnitComponent(campEntityId));
    entity.setEcsComponent(createBehaviorAgentComponent());
    return entity;
}

function createTestCamp(id: string = "camp-1"): Entity {
    const camp = new Entity(id);
    camp.setEcsComponent(createGoblinCampComponent());
    return camp;
}

function createTestFireSource(active: boolean = true): Entity {
    const fire = new Entity("fire-1");
    const fireComponent = createFireSourceComponent(15, 2);
    fireComponent.isActive = active;
    fire.setEcsComponent(fireComponent);
    return fire;
}

describe("KeepWarmBehavior", () => {
    describe("isValid", () => {
        it("returns false when warmth is at or above the cold threshold", () => {
            const behavior = createKeepWarmBehavior();
            const goblin = createTestGoblin(COLD_THRESHOLD);

            const valid = behavior.isValid(goblin);

            assert.strictEqual(valid, false);
        });
    });

    describe("utility", () => {
        it("returns higher utility for lower warmth", () => {
            const behavior = createKeepWarmBehavior();
            const goblin50 = createTestGoblin(50);
            const goblin30 = createTestGoblin(30);

            const utility50 = behavior.utility(goblin50);
            const utility30 = behavior.utility(goblin30);

            assert.ok(utility30 > utility50);
        });
    });

    describe("expand", () => {
        it("returns warmByFire action when fire exists in camp", () => {
            const behavior = createKeepWarmBehavior();
            const root = new Entity("root");
            const camp = createTestCamp("camp-1");
            const fire = createTestFireSource();
            const goblin = createTestGoblin(50, "camp-1");

            camp.addChild(fire);
            camp.addChild(goblin);
            root.addChild(camp);

            const actions = behavior.expand(goblin);

            assert.deepStrictEqual(actions, [
                { type: "warmByFire", fireEntityId: fire.id },
            ]);
        });
    });
});

import { describe, it } from "node:test";
import assert from "node:assert";
import { createKeepWarmBehavior } from "../../../../../src/game/behavior/behaviors/goblin/keepWarmBehavior.ts";
import { Entity } from "../../../../../src/game/entity/entity.ts";
import { createWarmthComponent, COLD_THRESHOLD } from "../../../../../src/game/component/warmthComponent.ts";
import { createGoblinUnitComponent } from "../../../../../src/game/component/goblinUnitComponent.ts";
import { createGoblinCampComponent } from "../../../../../src/game/component/goblinCampComponent.ts";
import { createFireSourceComponent } from "../../../../../src/game/component/fireSourceComponent.ts";
import { createBehaviorAgentComponent } from "../../../../../src/game/component/BehaviorAgentComponent.ts";

function createTestGoblin(warmth: number = 80, campEntityId: string = "camp-1"): Entity {
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
    const fireComponent = createFireSourceComponent(15, 2, 1);
    fireComponent.isActive = active;
    fire.setEcsComponent(fireComponent);
    return fire;
}

describe("KeepWarmBehavior", () => {
    describe("isValid", () => {
        it("returns true when warmth is below the cold threshold", () => {
            const behavior = createKeepWarmBehavior();
            const goblin = createTestGoblin(COLD_THRESHOLD - 1);

            const valid = behavior.isValid(goblin);

            assert.strictEqual(valid, true);
        });

        it("returns false when warmth is at or above the cold threshold", () => {
            const behavior = createKeepWarmBehavior();
            const goblin = createTestGoblin(COLD_THRESHOLD);

            const valid = behavior.isValid(goblin);

            assert.strictEqual(valid, false);
        });

        it("returns false when entity has no warmth component", () => {
            const behavior = createKeepWarmBehavior();
            const goblin = new Entity("goblin-1");
            goblin.setEcsComponent(createGoblinUnitComponent("camp-1"));

            const valid = behavior.isValid(goblin);

            assert.strictEqual(valid, false);
        });

        it("returns false when entity has no goblin unit component", () => {
            const behavior = createKeepWarmBehavior();
            const goblin = new Entity("goblin-1");
            goblin.setEcsComponent(createWarmthComponent(50));

            const valid = behavior.isValid(goblin);

            assert.strictEqual(valid, false);
        });
    });

    describe("utility", () => {
        it("returns 0 when warmth is at or above the cold threshold", () => {
            const behavior = createKeepWarmBehavior();
            const goblin = createTestGoblin(COLD_THRESHOLD);

            const utility = behavior.utility(goblin);

            assert.strictEqual(utility, 0);
        });

        it("returns approximately 60 when warmth is just below the cold threshold", () => {
            const behavior = createKeepWarmBehavior();
            const goblin = createTestGoblin(COLD_THRESHOLD - 1);

            const utility = behavior.utility(goblin);

            assert.ok(utility >= 60 && utility < 62);
        });

        it("returns higher utility for lower warmth", () => {
            const behavior = createKeepWarmBehavior();
            const goblin50 = createTestGoblin(50);
            const goblin30 = createTestGoblin(30);

            const utility50 = behavior.utility(goblin50);
            const utility30 = behavior.utility(goblin30);

            assert.ok(utility30 > utility50);
        });

        it("caps utility at 95 when warmth is very low", () => {
            const behavior = createKeepWarmBehavior();
            const goblin = createTestGoblin(0);

            const utility = behavior.utility(goblin);

            assert.ok(utility <= 95);
        });

        it("returns 0 when entity has no warmth component", () => {
            const behavior = createKeepWarmBehavior();
            const goblin = new Entity("goblin-1");

            const utility = behavior.utility(goblin);

            assert.strictEqual(utility, 0);
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

            assert.strictEqual(actions.length, 2);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "warmByFire");
        });

        it("returns empty array when no camp is found", () => {
            const behavior = createKeepWarmBehavior();
            const root = new Entity("root");
            const goblin = createTestGoblin(50, "nonexistent-camp");
            root.addChild(goblin);

            const actions = behavior.expand(goblin);

            assert.strictEqual(actions.length, 0);
        });
    });

    describe("name", () => {
        it("has name 'keepWarm'", () => {
            const behavior = createKeepWarmBehavior();

            assert.strictEqual(behavior.name, "keepWarm");
        });
    });
});

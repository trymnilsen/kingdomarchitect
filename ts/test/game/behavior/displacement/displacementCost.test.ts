import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createBehaviorAgentComponent,
    getBehaviorAgent,
} from "../../../../src/game/component/BehaviorAgentComponent.ts";
import {
    MovementStaminaComponentId,
    createMovementStaminaComponent,
    recordMove,
} from "../../../../src/game/component/movementStaminaComponent.ts";
import { classifyBlocker } from "../../../../src/game/behavior/displacement/displacementCost.ts";

/**
 * Build an agent. By default it is "settled" (pendingReplan cleared, empty queue) so it
 * classifies as displaceable. `utility` is its currentBehaviorUtility; `moving` puts a
 * moveTo at the head of its queue; `pendingReplan` keeps the not-yet-decided flag.
 */
function createAgent(
    id: string,
    {
        utility = 0,
        moving = false,
        pendingReplan = false,
    }: { utility?: number; moving?: boolean; pendingReplan?: boolean } = {},
): Entity {
    const entity = new Entity(id);
    entity.setEcsComponent(createBehaviorAgentComponent());
    entity.setEcsComponent(createMovementStaminaComponent());
    const agent = getBehaviorAgent(entity)!;
    agent.currentBehaviorUtility = utility;
    agent.actionQueue = moving
        ? [{ type: "moveTo", target: { x: 0, y: 0 } }]
        : [];
    agent.pendingReplan = pendingReplan ? { kind: "replan" } : undefined;
    return entity;
}

describe("classifyBlocker", () => {
    it("classifies a non-agent entity as immovable", () => {
        const entity = new Entity("inert");
        assert.deepStrictEqual(classifyBlocker(entity, 1), {
            kind: "immovable",
        });
    });

    it("classifies an entity that already moved this tick as movedThisTick", () => {
        const entity = createAgent("mover", { utility: 50 });
        const stamina = entity.getEcsComponent(MovementStaminaComponentId)!;
        recordMove(stamina, 5);
        assert.deepStrictEqual(classifyBlocker(entity, 5), {
            kind: "movedThisTick",
        });
    });

    it("classifies a walking entity (moveTo at queue head) as transient", () => {
        const entity = createAgent("walking", { utility: 50, moving: true });
        assert.deepStrictEqual(classifyBlocker(entity, 5), {
            kind: "transient",
        });
    });

    it("classifies an undecided entity (pendingReplan set) as transient", () => {
        const entity = createAgent("fresh", { pendingReplan: true });
        assert.deepStrictEqual(classifyBlocker(entity, 5), {
            kind: "transient",
        });
    });

    it("classifies a settled idle worker as displaceable with cost 0", () => {
        // Invariant: a settled worker has pendingReplan cleared and no moveTo, so it is
        // displaceable (not transient). See BehaviorSystem's idle handling.
        const idle = createAgent("idle", { utility: 0 });
        assert.deepStrictEqual(classifyBlocker(idle, 5), {
            kind: "displaceable",
            cost: 0,
        });
    });

    it("classifies a settled worker mid-task as displaceable with cost = utility", () => {
        const worker = createAgent("crafter", { utility: 50 });
        assert.deepStrictEqual(classifyBlocker(worker, 5), {
            kind: "displaceable",
            cost: 50,
        });
    });
});

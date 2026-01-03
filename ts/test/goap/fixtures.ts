import { healthPotion } from "../../src/data/inventory/items/resources.ts";
import { createGoapAgentComponent } from "../../src/game/component/goapAgentComponent.ts";
import { createHungerComponent } from "../../src/game/component/hungerComponent.ts";
import { createInventoryComponent } from "../../src/game/component/inventoryComponent.ts";
import { Entity } from "../../src/game/entity/entity.ts";

export function createTestRoot(): Entity {
    const root = new Entity("root");
    root.toggleIsGameRoot(true);
    return root;
}

export function createTestAgent(
    root: Entity,
    hunger: number,
    foodAmount: number,
): Entity {
    const agent = new Entity("agent");
    agent.setEcsComponent(createGoapAgentComponent());
    agent.setEcsComponent(createHungerComponent(hunger, 1));

    if (foodAmount > 0) {
        agent.setEcsComponent(
            createInventoryComponent([
                { item: healthPotion, amount: foodAmount },
            ]),
        );
    } else {
        agent.setEcsComponent(createInventoryComponent([]));
    }

    root.addChild(agent);
    return agent;
}

import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import type { Entity } from "../entity/entity.ts";
import {
    CraftingComponentId,
    completeCrafting,
} from "../component/craftingComponent.ts";
import {
    CollectableComponentId,
    addCollectableItems,
} from "../component/collectableComponent.ts";

export const craftingSystem = {
    onUpdate: update,
} satisfies EcsSystem;

/**
 * System that handles crafting progress
 * Checks entities with active crafting and completes them when duration is reached
 *
 * @param root The root entity to search for crafting buildings
 * @param currentTick The current game tick
 */
function update(root: Entity, currentTick: number): void {
    // Query all entities with CraftingComponent
    const craftingEntitiesMap = root.queryComponents(CraftingComponentId);

    for (const [entity, craftingComponent] of craftingEntitiesMap) {
        // Skip if not actively crafting
        if (!craftingComponent.activeCrafting) {
            continue;
        }

        const { recipe, startTick } = craftingComponent.activeCrafting;
        const ticksElapsed = currentTick - startTick;

        // Check if crafting is complete
        if (ticksElapsed >= recipe.duration) {
            // Get or create collectable component
            let collectableComponent = entity.getEcsComponent(
                CollectableComponentId,
            );
            if (!collectableComponent) {
                collectableComponent = {
                    id: CollectableComponentId,
                    items: [],
                };
                entity.setEcsComponent(collectableComponent);
            }

            // Add crafted items to collectable
            const outputs = recipe.outputs.map((output) => ({
                item: output.item,
                amount: output.amount,
            }));
            addCollectableItems(collectableComponent, outputs);

            // Mark collectable component as changed
            entity.invalidateComponent(CollectableComponentId);

            // Complete the crafting
            completeCrafting(craftingComponent);
            entity.invalidateComponent(CraftingComponentId);

            console.log(
                `[CraftingSystem] Completed crafting ${recipe.id} at entity ${entity.id}`,
            );
        }
    }
}

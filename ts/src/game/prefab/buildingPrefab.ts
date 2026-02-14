import { generateId } from "../../common/idGenerator.ts";
import type { Building } from "../../data/building/building.ts";
import { spriteRefs } from "../../asset/sprite.ts";
import { createBuildingComponent } from "../component/buildingComponent.ts";
import { createHealthComponent } from "../component/healthComponent.ts";
import { createSpriteComponent } from "../component/spriteComponent.ts";
import { Entity } from "../entity/entity.ts";
import { createVisibilityComponent } from "../component/visibilityComponent.ts";
import { createHousingComponent } from "../component/housingComponent.ts";
import { createCraftingComponent } from "../component/craftingComponent.ts";
import { createInventoryComponent } from "../component/inventoryComponent.ts";
import { woodenHouse } from "../../data/building/wood/house.ts";
import { blacksmith } from "../../data/building/stone/blacksmith.ts";
import { blacksmithRecipes } from "../../data/crafting/recipes/blacksmithRecipes.ts";
import { createWorkplaceComponent } from "../component/workplaceComponent.ts";
import { stockPile } from "../../data/building/wood/storage.ts";
import { carpenter } from "../../data/building/wood/carpenter.ts";
import { carpenterRecipes } from "../../data/crafting/recipes/carpenterRecipes.ts";
import { createStockpileComponent } from "../component/stockpileComponent.ts";
import { forrester } from "../../data/building/wood/forrester.ts";
import { createProductionComponent } from "../component/productionComponent.ts";
import { goblinCampfire } from "../../data/building/goblin/goblinCampfire.ts";
import { goblinHut } from "../../data/building/goblin/goblinHut.ts";
import { createFireSourceComponent } from "../component/fireSourceComponent.ts";

export function buildingPrefab(
    building: Building,
    startScaffolded: boolean = false,
): Entity {
    const entity = new Entity(generateId("building"));
    entity.setEcsComponent(createBuildingComponent(building, startScaffolded));
    entity.setEcsComponent(
        createHealthComponent(startScaffolded ? 10 : 100, 100),
    );
    entity.setEcsComponent(createVisibilityComponent());

    if (startScaffolded) {
        // Scaffolded buildings only get an inventory to hold construction materials
        if (building.requirements?.materials) {
            entity.setEcsComponent(createInventoryComponent());
        }
    } else {
        applyFunctionalComponents(entity, building);
    }

    entity.setEcsComponent(
        createSpriteComponent(
            startScaffolded ? spriteRefs.wooden_house_scaffold : building.icon,
            { x: 0, y: 0 },
        ),
    );
    return entity;
}

/**
 * Attaches the functional ECS components for a completed building.
 * Called both when creating a non-scaffolded building and when construction finishes.
 */
export function applyFunctionalComponents(
    entity: Entity,
    building: Building,
): void {
    if (building.id == woodenHouse.id) {
        entity.setEcsComponent(createHousingComponent());
    }
    if (building.id == blacksmith.id) {
        entity.setEcsComponent(createCraftingComponent(blacksmithRecipes));
        entity.setEcsComponent(createInventoryComponent());
        entity.setEcsComponent(createWorkplaceComponent());
    }
    if (building.id == carpenter.id) {
        entity.setEcsComponent(createCraftingComponent(carpenterRecipes));
        entity.setEcsComponent(createInventoryComponent());
        entity.setEcsComponent(createWorkplaceComponent());
    }
    if (building.id == stockPile.id) {
        entity.setEcsComponent(createInventoryComponent());
        entity.setEcsComponent(createStockpileComponent());
    }
    if (building.id == forrester.id) {
        entity.setEcsComponent(
            createProductionComponent("forrester_production"),
        );
    }
    if (building.id == goblinCampfire.id) {
        entity.setEcsComponent(createFireSourceComponent(15, 2, 1));
    }
    if (building.id == goblinHut.id) {
        entity.setEcsComponent(createHousingComponent());
    }
}

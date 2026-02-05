import { generateId } from "../../common/idGenerator.ts";
import type { Building } from "../../data/building/building.ts";
import { sprites2 } from "../../asset/sprite.ts";
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
    // Stockpiles get inventory for storing settlement resources
    if (building.id == stockPile.id) {
        entity.setEcsComponent(createInventoryComponent());
        entity.setEcsComponent(createStockpileComponent());
    }
    // Forrester is a production building that spawns trees
    if (building.id == forrester.id) {
        entity.setEcsComponent(
            createProductionComponent("forrester_production"),
        );
    }
    // Scaffolded buildings get inventory for storing construction materials
    if (startScaffolded && building.requirements?.materials) {
        entity.setEcsComponent(createInventoryComponent());
    }
    entity.setEcsComponent(
        createSpriteComponent(
            startScaffolded ? sprites2.wooden_house_scaffold : building.icon,
            { x: 0, y: 0 },
        ),
    );
    return entity;
}

import { generateId } from "../../common/idGenerator.js";
import type { Building } from "../../data/building/building.js";
import { sprites2 } from "../../asset/sprite.js";
import { createBuildingComponent } from "../component/buildingComponent.js";
import { createHealthComponent } from "../component/healthComponent.js";
import { createSpriteComponent } from "../component/spriteComponent.js";
import { Entity } from "../entity/entity.js";
import { createVisibilityComponent } from "../component/visibilityComponent.js";
import { createHousingComponent } from "../component/housingComponent.js";
import { createCraftingComponent } from "../component/craftingComponent.js";
import { createInventoryComponent } from "../component/inventoryComponent.js";
import { woodenHouse } from "../../data/building/wood/house.js";
import { blacksmith } from "../../data/building/stone/blacksmith.js";
import { blacksmithRecipes } from "../../data/crafting/recipes/blacksmithRecipes.js";

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
    }
    entity.setEcsComponent(
        createSpriteComponent(
            startScaffolded ? sprites2.wooden_house_scaffold : building.icon,
            { x: 0, y: 0 },
        ),
    );
    return entity;
}

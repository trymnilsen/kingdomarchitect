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
    entity.setEcsComponent(
        createSpriteComponent(
            startScaffolded ? sprites2.wooden_house_scaffold : building.icon,
            { x: 0, y: 0 },
        ),
    );
    return entity;
}

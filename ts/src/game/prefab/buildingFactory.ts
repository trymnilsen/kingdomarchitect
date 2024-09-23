import { generateId } from "../../common/idGenerator.js";
import { Building } from "../../data/building/building.js";
import { blacksmith } from "../../data/building/stone/blacksmith.js";
import { quary } from "../../data/building/stone/quary.js";
import { woodenHouse } from "../../data/building/wood/house.js";
import { woodenBuildings } from "../../data/building/wood/wood.js";
import { CraftingComponent } from "../component/building/craftingComponent.js";
import { QuaryComponent } from "../component/building/quaryComponent.js";
import { EntityComponent } from "../component/entityComponent.js";
import { HousingComponent } from "../component/housing/housingComponent.js";
import { InventoryComponent2 } from "../component/inventory/inventoryComponent.js";
import { JumpingInventoryItem } from "../component/inventory/jumpingInventoryItem.js";
import { Entity } from "../entity/entity.js";
import { buildingPrefab } from "./buildingPrefab.js";

export function buildingFactory(
    building: Building,
    scaffold: boolean = true,
): Entity {
    const extraComponents: EntityComponent[] = [];
    if (building.id == woodenHouse.id) {
        extraComponents.push(new HousingComponent());
    }
    if (building.id == quary.id) {
        const inventory = new InventoryComponent2();
        inventory.isCollectable = true;
        extraComponents.push(inventory);
        extraComponents.push(new JumpingInventoryItem());
        extraComponents.push(new QuaryComponent());
    }
    if (building.id == blacksmith.id) {
        const inventory = new InventoryComponent2();
        inventory.isCollectable = true;
        extraComponents.push(inventory);
        extraComponents.push(new JumpingInventoryItem());
        extraComponents.push(new CraftingComponent());
    }

    return buildingPrefab(
        generateId("building"),
        building,
        extraComponents,
        scaffold,
    );
}

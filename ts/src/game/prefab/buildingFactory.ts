import { generateId } from "../../common/idGenerator.js";
import { Building } from "../../data/building/building.js";
import { blacksmith } from "../../data/building/stone/blacksmith.js";
import { quary } from "../../data/building/stone/quary.js";
import { woodenHouse } from "../../data/building/wood/house.js";
import { woodenBuildings } from "../../data/building/wood/wood.js";
import { CraftingComponent } from "../componentOld/building/craftingComponent.js";
import { HousingComponent } from "../componentOld/building/housingComponent.js";
import { QuaryComponent } from "../componentOld/building/quaryComponent.js";
import { EntityComponent } from "../componentOld/entityComponent.js";
import { InventoryComponent2 } from "../componentOld/inventory/inventoryComponent.js";
import { JumpingInventoryItem } from "../componentOld/inventory/jumpingInventoryItem.js";
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

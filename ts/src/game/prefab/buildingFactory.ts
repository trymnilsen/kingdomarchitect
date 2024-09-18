import { generateId } from "../../common/idGenerator.js";
import { Building } from "../../data/building/building.js";
import { quary } from "../../data/building/stone/quary.js";
import { woodenHouse } from "../../data/building/wood/house.js";
import { woodenBuildings } from "../../data/building/wood/wood.js";
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
        inventory.clear();
        extraComponents.push(inventory);
        extraComponents.push(new JumpingInventoryItem());
        extraComponents.push(new QuaryComponent());
    }
    return buildingPrefab(
        generateId("building"),
        building,
        extraComponents,
        scaffold,
    );
}

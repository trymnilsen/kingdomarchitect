import { generateId } from "../../../common/idGenerator";
import { Building } from "../../../data/building/building";
import { woodenBuildings } from "../../../data/building/wood";
import { EntityComponent } from "../component/entityComponent";
import { HousingComponent } from "../component/housing/housingComponent";
import { Entity } from "../entity/entity";
import { buildingPrefab } from "./buildingPrefab";

export function buildingFactory(building: Building): Entity {
    const extraComponents: EntityComponent[] = [];
    if (building.id == woodenBuildings[0].id) {
        extraComponents.push(new HousingComponent());
    }
    return buildingPrefab(generateId("building"), building, extraComponents);
}

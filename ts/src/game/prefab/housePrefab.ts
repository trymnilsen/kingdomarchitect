import { sprites2 } from "../../module/asset/sprite.js";
import { woodenBuildings } from "../../data/building/wood/wood.js";
import { BuildingComponent } from "../componentOld/building/buildingComponent.js";
import { HealthComponent } from "../componentOld/health/healthComponent.js";
import { Entity } from "../entity/entity.js";
import { VisibilityComponent } from "../componentOld/visibility/visibilityComponent.js";
import { largeDiamondPattern } from "../../common/pattern.js";
import { zeroPoint } from "../../common/point.js";
import { generateId } from "../../common/idGenerator.js";
import { HousingComponent } from "../componentOld/building/housingComponent.js";

export function housePrefab(
    id: string = generateId("house"),
    scaffold: boolean = false,
): Entity {
    const house = new Entity(id);
    const buildingComponent = new BuildingComponent(
        sprites2.wooden_house,
        sprites2.wooden_house_scaffold,
        woodenBuildings[0],
    );

    let currentHealth = 100;
    if (scaffold) {
        currentHealth = 10;
    } else {
        buildingComponent.finishBuild();
    }

    const healthComponent = new HealthComponent(currentHealth, 100, {
        min: 0,
        max: 100,
    });
    const visibilityComponent = new VisibilityComponent(
        largeDiamondPattern,
        zeroPoint(),
    );

    const housingComponent = new HousingComponent();
    house.addComponent(visibilityComponent);
    house.addComponent(buildingComponent);
    house.addComponent(healthComponent);
    house.addComponent(housingComponent);
    return house;
}

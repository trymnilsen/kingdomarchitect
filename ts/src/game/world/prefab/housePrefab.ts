import { sprites2 } from "../../../asset/sprite";
import { BuildingComponent } from "../component/building/buildingComponent";
import { HousingComponent } from "../component/building/housingComponent";
import { HealthComponent } from "../component/health/healthComponent";
import { Entity } from "../entity/entity";

export function housePrefab(
    id: string,
    scaffold: boolean,
    initalResident?: Entity
): Entity {
    const house = new Entity(id);
    const buildingComponent = new BuildingComponent(
        sprites2.wooden_house,
        sprites2.wooden_house_scaffold
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

    const housingComponent = new HousingComponent(initalResident);
    house.addComponent(buildingComponent);
    house.addComponent(healthComponent);
    house.addComponent(housingComponent);
    return house;
}

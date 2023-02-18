import { sprites2 } from "../../../asset/sprite";
import { BuildingComponent } from "../component/building/buildingComponent";
import { HealthComponent } from "../component/health/healthComponent";
import { Entity } from "../entity/entity";

export function housePrefab(id: string, scaffold: boolean): Entity {
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

    house.addComponent(buildingComponent);
    house.addComponent(healthComponent);
    return house;
}

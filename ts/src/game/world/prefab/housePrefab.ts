import { sprites } from "../../../asset/sprite";
import {
    woodenHouseScaffold,
    woodenHouseSprite,
} from "../../../asset/sprites/woodHouseSprite";
import { BuildingComponent } from "../component/building/buildingComponent";
import { SpriteComponent } from "../component/draw/spriteComponent";
import { HealthComponent } from "../component/health/healthComponent";
import { Entity } from "../entity/entity";

export function housePrefab(id: string, scaffold: boolean): Entity {
    const house = new Entity(id);
    const buildingComponent = new BuildingComponent(
        woodenHouseSprite,
        woodenHouseScaffold
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

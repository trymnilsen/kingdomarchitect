import { sprites2 } from "../../module/asset/sprite.js";
import { zeroPoint } from "../../common/point.js";
import { SpriteComponent } from "../componentOld/draw/spriteComponent.js";
import { HealthComponent } from "../componentOld/health/healthComponent.js";
import { StaticSelectionInfoProvider } from "../componentOld/selection/provider/staticSelectionInfoProvider.js";
import { SelectionInfoComponent } from "../componentOld/selection/selectionInfoComponent.js";
import { Entity } from "../entity/entity.js";

export function trainingDummyPrefab(id: string): Entity {
    const entity = new Entity(id);

    entity.addComponent(
        new SpriteComponent(
            sprites2.training_dummy,
            { x: 2, y: 0 },
            {
                x: 32,
                y: 32,
            },
        ),
    );
    entity.addComponent(new HealthComponent(50, 50));
    entity.addComponent(
        new SelectionInfoComponent(
            new StaticSelectionInfoProvider(
                sprites2.training_dummy,
                "Henry",
                "Training dummy",
            ),
        ),
    );
    return entity;
}

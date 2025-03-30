import { zeroPoint } from "../../common/point.js";
import { sprites2 } from "../../module/asset/sprite.js";
import { SpriteComponent } from "../componentOld/draw/spriteComponent.js";
import { HealthComponent } from "../componentOld/health/healthComponent.js";
import {
    getTreeSprite,
    TreeComponent,
} from "../componentOld/resource/treeComponent.js";
import { StaticSelectionInfoProvider } from "../componentOld/selection/provider/staticSelectionInfoProvider.js";
import { SelectionInfoComponent } from "../componentOld/selection/selectionInfoComponent.js";
import { Entity } from "../entity/entity.js";

export function treePrefab(id: string, variation: number): Entity {
    const tree = new Entity(id);
    const treeComponent = new TreeComponent(variation);
    const healthComponent = new HealthComponent(100, 100, {
        min: 10,
        max: 100,
    });
    tree.addComponent(
        new SelectionInfoComponent(
            new StaticSelectionInfoProvider(
                sprites2.tree_1,
                "Tree",
                "Resource",
            ),
        ),
    );
    const treeSprite = getTreeSprite(variation);
    tree.addComponent(
        new SpriteComponent(treeSprite, { x: 4, y: 4 }, { x: 32, y: 32 }),
    );
    tree.addComponent(treeComponent);
    tree.addComponent(healthComponent);

    return tree;
}

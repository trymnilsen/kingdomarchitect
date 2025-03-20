import { sprites2 } from "../../module/asset/sprite.js";
import { HealthComponent } from "../component/health/healthComponent.js";
import { TreeComponent } from "../component/resource/treeComponent.js";
import { StaticSelectionInfoProvider } from "../component/selection/provider/staticSelectionInfoProvider.js";
import { SelectionInfoComponent } from "../component/selection/selectionInfoComponent.js";
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
    tree.addComponent(treeComponent);
    tree.addComponent(healthComponent);

    return tree;
}

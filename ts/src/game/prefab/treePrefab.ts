import { HealthComponent } from "../component/health/healthComponent.js";
import { TreeComponent } from "../component/resource/treeComponent.js";
import { Entity } from "../entity/entity.js";

export function treePrefab(id: string, variation: number): Entity {
    const tree = new Entity(id);
    const treeComponent = TreeComponent.createInstance(variation);
    const healthComponent = HealthComponent.createInstance(100, 100, {
        min: 10,
        max: 100,
    });
    tree.addComponent(treeComponent);
    tree.addComponent(healthComponent);

    return tree;
}

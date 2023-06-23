import { HealthComponent } from "../component/health/healthComponent.js";
import { TreeComponent } from "../component/resource/treeComponent.js";
import { Entity } from "../entity/entity.js";
export function treePrefab(id, variation) {
    const tree = new Entity(id);
    const treeComponent = new TreeComponent(variation);
    const healthComponent = new HealthComponent(100, 100, {
        min: 10,
        max: 100
    });
    tree.addComponent(treeComponent);
    tree.addComponent(healthComponent);
    return tree;
}

import { HealthComponent } from "../component/health/healthComponent";
import { TreeComponent } from "../component/resource/treeComponent";
import { Entity } from "../entity/entity";

export function treePrefab(id: string, variation: number): Entity {
    const tree = new Entity(id);
    const treeComponent = new TreeComponent(variation);
    const healthComponent = new HealthComponent(100, 100, {
        min: 10,
        max: 100,
    });
    tree.addComponent(treeComponent);
    tree.addComponent(healthComponent);

    return tree;
}

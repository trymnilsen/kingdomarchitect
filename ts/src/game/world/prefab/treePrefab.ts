import { TreeComponent } from "../component/resource/treeComponent";
import { Entity } from "../entity/entity";

export function treePrefab(id: string, variation: number): Entity {
    const tree = new Entity(id);
    const treeComponent = new TreeComponent(variation);
    tree.addComponent(treeComponent);

    return tree;
}

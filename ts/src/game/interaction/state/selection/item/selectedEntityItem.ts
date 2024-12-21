import { Point } from "../../../../../common/point.js";
import { TransformComponent } from "../../../../../ecs/transformComponent.js";
import { SelectedWorldItem } from "./selectedWorldItem.js";

export class SelectedEntityItem implements SelectedWorldItem {
    constructor(readonly transform: TransformComponent) {}
    get tilePosition(): Point {
        return this.transform.position;
    }

    isSelectedItem(item: unknown): boolean {
        return item === this;
    }
}

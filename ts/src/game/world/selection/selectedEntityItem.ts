import { Point } from "../../../common/point";
import { Entity } from "../entity/entity";
import { SelectedWorldItem } from "./selectedWorldItem";

export class SelectedEntityItem implements SelectedWorldItem {
    constructor(readonly entity: Entity) {}
    get tilePosition(): Point {
        return this.entity.worldPosition;
    }
    get selectionSize(): Point {
        return {
            x: 1,
            y: 1,
        };
    }
    isSelectedItem(item: any): boolean {
        return item === this;
    }
}

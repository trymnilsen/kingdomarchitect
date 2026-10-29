import { type Point } from "../../../common/point.ts";
import { Entity } from "../../entity/entity.ts";
import { type SelectedWorldItem } from "./selectedWorldItem.ts";

export class SelectedEntityItem implements SelectedWorldItem {
    readonly entity: Entity;

    constructor(entity: Entity) {
        this.entity = entity;
    }

    get tilePosition(): Point {
        return this.entity.worldPosition;
    }
    get selectionSize(): Point {
        return {
            x: 1,
            y: 1,
        };
    }
    isSameItem(other: SelectedWorldItem): boolean {
        return other instanceof SelectedEntityItem && other.entity === this.entity;
    }
}

import { Sprite2 } from "../../../../asset/sprite.js";
import { Entity } from "../../../entity/entity.js";
import { SelectionInfo } from "../selectionInfo.js";
import { SelectionInfoProvider } from "../selectionInfoProvider.js";

export class StaticSelectionInfoProvider implements SelectionInfoProvider {
    constructor(
        private icon: Sprite2,
        private title: string,
        private subtitle: string,
    ) {}

    getInfo(_entity: Entity): SelectionInfo | null {
        return {
            icon: this.icon,
            title: this.title,
            subtitle: this.subtitle,
        };
    }
}

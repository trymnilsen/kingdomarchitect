import { Sprite2 } from "../../../asset/sprite.js";
import { Entity } from "../../entity/entity.js";
import { EntityComponent } from "../entityComponent.js";
import { SelectionInfo } from "./selectionInfo.js";
import { SelectionInfoProvider } from "./selectionInfoProvider.js";

export class SelectionInfoComponent extends EntityComponent {
    constructor(private provider: SelectionInfoProvider) {
        super();
    }

    getSelectionInfo(): SelectionInfo | null {
        return this.provider.getInfo(this.entity);
    }
}

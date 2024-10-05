import { Entity } from "../../entity/entity.js";
import { SelectionInfo } from "./selectionInfo.js";

export interface SelectionInfoProvider {
    getInfo(component: Entity): SelectionInfo | null;
}

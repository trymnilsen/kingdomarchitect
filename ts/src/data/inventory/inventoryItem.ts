import { ImageAsset } from "../../asset/assets";

export interface InventoryItem {
    id: string;
    name: string;
    asset: ImageAsset;
}

import { Sprite2 } from "../../asset/sprite";

export interface InventoryItem {
    id: string;
    name: string;
    asset: Sprite2;
    hint?: string;
}

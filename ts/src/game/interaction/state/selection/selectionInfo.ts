import type { SpriteRef } from "../../../../asset/sprite.ts";
import type { ConstructionMaterialProgress } from "../../../building/materialQuery.ts";

export interface SelectionInfo {
    icon: SpriteRef;
    title: string;
    subtitle: string;
    materials?: ConstructionMaterialProgress[];
}

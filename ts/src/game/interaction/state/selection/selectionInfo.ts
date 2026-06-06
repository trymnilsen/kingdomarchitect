import type { SpriteRef } from "../../../../asset/sprite.ts";
import type { ConstructionMaterialProgress } from "../../../building/materialQuery.ts";
import type { LightBand } from "../../../light/lightBand.ts";

export interface SelectionInfo {
    icon: SpriteRef;
    title: string;
    subtitle: string;
    materials?: ConstructionMaterialProgress[];
    /** The illumination band of the selected tile, when known. */
    light?: LightBand;
}

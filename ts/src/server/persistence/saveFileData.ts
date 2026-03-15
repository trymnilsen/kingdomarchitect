import type { SerializedEntity } from "./serializedEntity.ts";
import type { SerializedWorldMeta } from "./serializedWorldMeta.ts";

export interface SaveFileData {
    meta: SerializedWorldMeta;
    entities: SerializedEntity[];
    rootComponents: Record<string, unknown>;
}

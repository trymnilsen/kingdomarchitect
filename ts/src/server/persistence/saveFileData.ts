import type { LogEntry } from "../../common/logging/logEntry.ts";
import type { SerializedEntity } from "./serializedEntity.ts";
import type { SerializedWorldMeta } from "./serializedWorldMeta.ts";

export interface SaveFileData {
    meta: SerializedWorldMeta;
    entities: SerializedEntity[];
    rootComponents: Record<string, unknown>;
    logs?: LogEntry[];
}

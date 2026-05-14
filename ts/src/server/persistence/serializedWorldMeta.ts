import type { IdCounterMap } from "../../common/idGenerator.ts";

export interface SerializedWorldMeta {
    version: number;
    tick: number;
    seed: number;
    idCounters: IdCounterMap;
}

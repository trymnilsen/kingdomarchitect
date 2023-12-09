import { Effect } from "../../../data/effect/effect.js";
import { Entity } from "../../entity/entity.js";
import { EffectProcResult } from "./effectProcResult.js";

export type EffectProc = (effect: Effect, entity: Entity) => EffectProcResult;

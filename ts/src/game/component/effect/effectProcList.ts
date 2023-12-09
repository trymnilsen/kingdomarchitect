import { healEffectId } from "../../../data/effect/health/healEffect.js";
import { EffectProc } from "./effectProc.js";
import { healEffectProc } from "./proc/health/healEffectProc.js";

export const effectProcList: { [id: string]: EffectProc } = {
    [healEffectId]: healEffectProc,
};

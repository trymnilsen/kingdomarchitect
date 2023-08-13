import { AggroComponent } from "./actor/mob/aggroComponent.js";
import { ComponentFactory } from "./entityComponent.js";

type LoaderMap = {[name: string]: ComponentFactory }
export const loaders: LoaderMap = {
    [AggroComponent.name] : 
}
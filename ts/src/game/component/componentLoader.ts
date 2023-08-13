import { ConstructorFunction } from "../../common/constructor.js";
import { AggroComponent } from "./actor/mob/aggroComponent.js";
import { EntityComponent } from "./entityComponent.js";

type LoaderMap = { [name: string]: ConstructorFunction<EntityComponent> };
export const loaders: LoaderMap = {
    [AggroComponent.name]: AggroComponent,
};

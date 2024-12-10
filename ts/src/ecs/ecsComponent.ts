import { ConstructorFunction } from "../common/constructor.js";

export abstract class EcsComponent {}
export type ComponentFn = ConstructorFunction<EcsComponent>;

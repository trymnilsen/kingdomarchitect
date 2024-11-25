import { ReadableSet, SparseSet } from "../common/structure/sparseSet.js";
import { ComponentFn } from "./ecsComponent.js";

export type EcsEntity = number;
export type QueryData<T extends QueryObject = QueryObject> = {
    [P in keyof T]: ReadableSet<InstanceType<T[P]>>;
};

export interface QueryObject<T extends ComponentFn = ComponentFn> {
    [componentName: string]: T;
}

type UpdateFunction<T extends QueryObject> = (
    components: QueryData<T>,
    gameTime: number,
) => void;

enum EcsUpdateMode {
    Draw,
    Update,
    DrawUpdate,
}

export class EcsSystem<T extends QueryObject = QueryObject> {
    private onUpdate: UpdateFunction<T> | null = null;
    private mode;
    constructor(public query: Readonly<T>) {}

    runUpdate(components: QueryData<T>, gameTime: number) {
        if (this.onUpdate) {
            this.onUpdate(components, gameTime);
        }
    }

    withUpdate(updateFunction: UpdateFunction<T>): void {
        this.onUpdate = updateFunction;
    }
}

import { EcsComponent } from "../ecsComponent.js";
import { EcsEvent } from "./ecsEvent.js";

export enum ComponentEventType {
    Add,
    Remove,
}

export class EcsComponentEvent extends EcsEvent {
    constructor(
        public readonly component: EcsComponent | EcsComponent[],
        public readonly type: ComponentEventType,
    ) {
        super();
    }
}

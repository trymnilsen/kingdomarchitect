import { BaseEvent } from "../../../common/event/baseEvent";
import { EntityComponent } from "./entityComponent";

export abstract class ComponentEvent<T extends EntityComponent> {
    constructor(public readonly sourceComponent: T) {}
}
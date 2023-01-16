import { BaseEvent } from "../../../common/event/baseEvent";
import { EntityComponent } from "./entityComponent";

export abstract class ComponentEvent {
    constructor(public readonly sourceComponent: EntityComponent) {}
}

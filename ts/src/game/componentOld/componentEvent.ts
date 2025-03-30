import { EntityComponent } from "./entityComponent.js";

export abstract class ComponentEvent<T extends EntityComponent> {
    constructor(readonly sourceComponent: T) {}
}

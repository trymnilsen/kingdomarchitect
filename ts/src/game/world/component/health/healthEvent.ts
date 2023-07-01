import { ComponentEvent } from "../componentEvent.js";
import { HealthComponent } from "./healthComponent.js";

export class HealthEvent extends ComponentEvent<HealthComponent> {
    constructor(
        public readonly oldHealth: number,
        public readonly newHealth: number,
        sourceComponent: HealthComponent
    ) {
        super(sourceComponent);
    }
}

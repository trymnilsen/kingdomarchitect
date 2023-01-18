import { ComponentEvent } from "../componentEvent";
import { HealthComponent } from "./healthComponent";

export class HealthEvent extends ComponentEvent<HealthComponent> {
    constructor(
        public readonly oldHealth: number,
        public readonly newHealth: number,
        sourceComponent: HealthComponent
    ) {
        super(sourceComponent);
    }
}

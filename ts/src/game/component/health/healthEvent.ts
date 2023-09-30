import { Entity } from "../../entity/entity.js";
import { ComponentEvent } from "../componentEvent.js";
import { HealthComponent } from "./healthComponent.js";

export class HealthEvent extends ComponentEvent<HealthComponent> {
    /**
     * Creates a new health event due to change of the health
     * @param oldHealth the old health before the change
     * @param newHealth the new health after the change
     * @param causeEntity the entity that caused the change to happen
     * @param sourceComponent the healthComponent the event happend on
     */
    constructor(
        readonly oldHealth: number,
        readonly newHealth: number,
        readonly causeEntity: Entity | null,
        sourceComponent: HealthComponent
    ) {
        super(sourceComponent);
    }
}

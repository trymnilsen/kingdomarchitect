import { EntityComponent } from "../entityComponent.js";

export class WeightComponent extends EntityComponent {
    constructor(public weight: number) {
        super();
    }
}

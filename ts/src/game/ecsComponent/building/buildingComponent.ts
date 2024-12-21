import { Building } from "../../../data/building/building.js";
import { EcsComponent } from "../../../ecs/ecsComponent.js";

export class BuildingComponent extends EcsComponent {
    constructor(
        public building: Building,
        public isScaffolded: boolean,
    ) {
        super();
    }
}

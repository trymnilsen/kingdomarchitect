import { Building } from "../../../data/building/building.js";

export class BuildingComponent {
    constructor(
        public building: Building,
        public isScaffolded: boolean,
    ) {}
}

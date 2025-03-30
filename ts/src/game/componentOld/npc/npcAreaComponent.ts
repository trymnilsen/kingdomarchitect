import { Bounds } from "../../../common/bounds.js";
import { Point } from "../../../common/point.js";
import { EntityComponent } from "../entityComponent.js";

export class NpcAreaComponent extends EntityComponent {
    constructor(
        private bounds: Bounds,
        private spawnPoints: Point[],
    ) {
        super();
    }
}

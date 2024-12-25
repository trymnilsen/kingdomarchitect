import { Bounds, zeroBounds } from "../../../common/bounds.js";
import { Point } from "../../../common/point.js";
import { EcsComponent } from "../../../ecs/ecsComponent.js";

export class NpcAreaComponent extends EcsComponent {
    bounds: Bounds = zeroBounds();
    spawnPoints: Point[] = [];
}

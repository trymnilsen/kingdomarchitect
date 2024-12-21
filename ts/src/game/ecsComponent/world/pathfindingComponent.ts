import { EcsComponent } from "../../../ecs/ecsComponent.js";
import { Graph } from "../../../path/graph/graph.js";

export class PathfindingComponent extends EcsComponent {
    constructor(public readonly graph: Graph) {
        super();
    }
}

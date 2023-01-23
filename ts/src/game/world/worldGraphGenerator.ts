import { Graph } from "../../path/graph";
import { GraphGenerator } from "../../path/graphGenerator";
import { createGraphFromNodes } from "./component/root/path/generateGraph";
import { Entity } from "./entity/entity";

export class WorldGraphGenerator implements GraphGenerator {
    constructor(private rootNode: Entity) {}
    createGraph(): Graph {
        return createGraphFromNodes(this.rootNode);
    }
}

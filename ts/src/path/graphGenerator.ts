import { Graph } from "./graph";

export interface GraphGenerator {
    createGraph(): Graph;
}

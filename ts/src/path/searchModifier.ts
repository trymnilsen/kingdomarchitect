import { GraphNode } from "./graph/graph.js";

export const defaultWeightModifier = (node: GraphNode) => node.weight;
export const blockBuildingsModifier = (node: GraphNode) => {
    return node.weight >= 20 ? 0 : node.weight;
};

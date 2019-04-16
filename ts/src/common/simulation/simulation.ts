import { JsonTree } from "../jsontree/jsonNode";
import { NodeOperation } from "../jsontree/nodeOperations";
import { Action } from "./action";

export interface SimulationEvent {
    source: string;
    action: string;
}
export class Simulation {
    private state: JsonTree;
    public constructor(state: JsonTree) {
        this.state = state;
    }
    public dispatchAction(action: Action): NodeOperation[] {
        return [];
    }
    public ingestOperations(nodeOperation: NodeOperation[]): void {}
}

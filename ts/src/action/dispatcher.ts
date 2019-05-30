import { Action } from "./action";
import { Reducer } from "./reducer";
import { JsonNode } from "../state/jsonNode";
import { applyOperations } from "../state/jsonOperations";
import { DataTree } from "../state/dataNode";

export class Dispatcher {
    private rootReducer: Reducer;
    private state: DataTree;
    public constructor(rootReducer: Reducer, state: DataTree) {
        this.rootReducer = rootReducer;
        this.state = state;
    }
    public doAction(action: Action) {
        const operations = this.rootReducer(action, this.state);
        console.log(`Action: ${action.name.join(",")} ops: `, operations);
        applyOperations(operations, this.state);
    }
}

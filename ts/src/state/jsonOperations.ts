import { Json } from "../util/json";
import { DataTree } from "./dataNode";

export type NodeOperation = {
    operation: "add" | "set" | "remove";
    path: string[];
    data: Json;
};

export function applyOperations(
    operations: NodeOperation | NodeOperation[],
    state: DataTree
) {
    if (!Array.isArray(operations)) {
        operations = [operations];
    }

    operations.forEach((op) => {
        switch (op.operation) {
            case "add":
                state.get(op.path).push(op.data);
                break;
            case "set":
                state.get(op.path).set(op.data);
                break;
            case "remove":
                state.get(op.path).remove();
                break;
            default:
                break;
        }
    });
}

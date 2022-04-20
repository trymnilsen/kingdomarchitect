import { Completer } from "../../common/promise";
import { InteractionState } from "./interactionState";
import { InteractionStateHistory } from "./interactionStateHistory";

export interface InteractionStateChanger {
    push(state: InteractionState): Promise<unknown>;
    replace(state: InteractionState): void;
    pop(result: unknown): void;
    clear(): void;
}

export class CommitableInteractionStateChanger
    implements InteractionStateChanger
{
    private operations: StateOperation[] = [];

    public get hasOperations(): boolean {
        return this.operations.length > 0;
    }

    push(state: InteractionState): Promise<unknown> {
        const completer = new Completer();
        this.operations.push({
            type: "push",
            newState: state,
            completer: completer,
        });

        return completer.promise;
    }
    replace(state: InteractionState): void {
        this.operations.push({
            type: "replace",
            newState: state,
        });
    }
    pop(result: unknown): void {
        this.operations.push({
            type: "pop",
            result: result,
        });
    }
    clear(): void {
        this.operations.push({
            type: "clear",
        });
    }

    apply(history: InteractionStateHistory) {
        for (const operation of this.operations) {
            switch (operation.type) {
                case "push":
                    history.push(operation.newState, operation.completer);
                    break;
                case "pop":
                    history.pop(operation.result);
                    break;
                case "replace":
                    history.replace(operation.newState);
                    break;
                case "clear":
                    history.clear();
                    break;
            }
        }
    }
}

type StateOperation =
    | PopOperation
    | ReplaceOperation
    | PushOperation
    | ClearOperation;

interface PopOperation {
    type: "pop";
    result: unknown;
}

interface ReplaceOperation {
    type: "replace";
    newState: InteractionState;
}

interface PushOperation {
    type: "push";
    newState: InteractionState;
    completer: Completer<unknown>;
}

interface ClearOperation {
    type: "clear";
}

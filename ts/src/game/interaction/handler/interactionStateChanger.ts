import { InteractionState } from "./interactionState.js";
import { InteractionStateHistory } from "./interactionStateHistory.js";

export interface InteractionStateChanger {
    push(state: InteractionState, onPop?: (result: unknown) => void): void;
    replace(state: InteractionState): void;
    pop(result: unknown): void;
    clear(): void;
    hasOperations: boolean;
}

export class CommitableInteractionStateChanger
    implements InteractionStateChanger
{
    private operations: StateOperation[] = [];

    public get hasOperations(): boolean {
        return this.operations.length > 0;
    }

    push(state: InteractionState, onPop?: (value: unknown) => void) {
        this.operations.push({
            type: "push",
            newState: state,
            onPushCallback: onPop,
        });
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
            console.log("Handling interactionStateOperation:", operation);
            switch (operation.type) {
                case "push":
                    history.push(operation.newState, operation.onPushCallback);
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
        // Clear the list of pending operations so that we don't re-apply
        // an operation later
        this.operations = [];
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
    onPushCallback?: (value: unknown) => void;
}

interface ClearOperation {
    type: "clear";
}

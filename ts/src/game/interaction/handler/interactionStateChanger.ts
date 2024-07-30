import { InteractionState } from "./interactionState.js";
import { InteractionStateHistory } from "./interactionStateHistory.js";

export type InteractionStateChanger = {
    push(state: InteractionState, onPop?: (result: unknown) => void): void;
    replace(state: InteractionState): void;
    pop(result: unknown): void;
    clear(): void;
    hasOperations: boolean;
};

export class CommitableInteractionStateChanger
    implements InteractionStateChanger
{
    private operations: StateOperation[] = [];

    get hasOperations(): boolean {
        return this.operations.length > 0;
    }

    /**
     * Push the given state to the stack of states, will allow poping back to it
     * @param state
     * @param onPop
     */
    push(state: InteractionState, onPop?: (value: unknown) => void) {
        this.operations.push({
            type: "push",
            newState: state,
            onPushCallback: onPop,
        });
    }

    /**
     * Replace the current state with the given,
     * the current state will be disposed
     * @param state
     */
    replace(state: InteractionState): void {
        this.operations.push({
            type: "replace",
            newState: state,
        });
    }

    /**
     * Pop and dispose the current state
     * @param result
     */
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

type PopOperation = {
    type: "pop";
    result: unknown;
};

type ReplaceOperation = {
    type: "replace";
    newState: InteractionState;
};

type PushOperation = {
    type: "push";
    newState: InteractionState;
    onPushCallback?: (value: unknown) => void;
};

type ClearOperation = {
    type: "clear";
};

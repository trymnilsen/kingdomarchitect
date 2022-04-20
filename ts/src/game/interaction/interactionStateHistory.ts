import { Completer } from "../../common/promise";
import { InteractionState } from "./interactionState";
import { InteractionStateChanger } from "./interactionStateChanger";
import { RootState } from "./state/rootState";

interface InteractionStateHistoryEntry {
    state: InteractionState;
    popCompleter?: Completer<unknown>;
}

/**
 * The InteractionStateHistory contains a stack of InteractionStates that
 * is active or have been active. This enables us to have a back functionality
 * if we show a menu or a specific UI state.
 */
export class InteractionStateHistory implements InteractionStateChanger {
    private history: InteractionStateHistoryEntry[] = [];

    /**
     * Retrieve the currently active interaction state
     */
    public get state(): InteractionState {
        return this.history[this.history.length - 1].state;
    }

    constructor() {
        const rootState = new RootState();
        this.history.push({ state: rootState });
    }

    /**
     * Pushes a new state to the top of our state stack. Cause the currently
     * active state before the push is perfomed to be set as inactive.
     * @param state The new state to push and set as active
     */
    public push(
        state: InteractionState,
        popCompleter: Completer<unknown>
    ): void {
        console.log("Pushing state: ", state.constructor.name);
        this.history[this.history.length - 1].state.onInactive();
        // Create a pop completer that can we awaited to wait for a result
        // This enables awaiting this function and resume with a value
        this.history.push({
            state,
            popCompleter,
        });
        state.onActive();
    }

    /**
     * Replaces the currently active state with the provided state.
     * Will call onInactive on the state to be replaced after removing it from
     * the stack
     * @param state the state to replace the current state with
     */
    public replace(state: InteractionState) {
        if (this.history.length == 1) {
            throw Error("Cannot replace root state");
        }
        console.log("replacing state: ", state.constructor.name);
        // Pop the current state. Both to remove and to get a reference to it
        const replacedState = this.history.pop();
        // Set it to inactive
        replacedState?.state.onInactive();
        // If it has a promise for when it is poped, reject it to avoid it
        // waiting forever for a state that will now never be popped with
        // a result
        if (replacedState?.popCompleter) {
            replacedState.popCompleter.rejectWith("State was replaced");
        }
        // Push the new state and set it to active
        this.history.push({ state });
        state.onActive();
    }

    /**
     * Pops the stack of the currenly active state causing the previous state
     * to become active
     */
    public pop(value?: unknown) {
        if (this.history.length == 1) {
            throw Error("Cannot pop root state");
        }
        console.log("popping state");
        const poppedState = this.history.pop();
        poppedState?.state.onInactive();
        this.history[this.history.length - 1].state.onActive();
        this.history[this.history.length - 1].popCompleter?.resolveWith(value);
    }

    /**
     * Clears all currently pushed states and resets to the RootState
     */
    public clear() {
        const items = this.history.length;
        for (let i = items; i > 1; i--) {
            const item = this.history.pop();
            item?.state.onInactive();
            item?.popCompleter?.rejectWith("History was explicity cleared");
        }
        this.history[0].state.onActive();
    }
}

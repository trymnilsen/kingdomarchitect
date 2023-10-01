import { RootState } from "../state/root/rootState.js";
import { InteractionState } from "./interactionState.js";
import { StateContext } from "./stateContext.js";

type InteractionStateHistoryEntry = {
    state: InteractionState;
    onPop?: (value: unknown) => void;
}

/**
 * The InteractionStateHistory contains a stack of InteractionStates that
 * is active or have been active. This enables us to have a back functionality
 * if we show a menu or a specific UI state.
 */
export class InteractionStateHistory {
    private history: InteractionStateHistoryEntry[] = [];

    /**
     * Retrieve the currently active interaction state
     */
    get state(): InteractionState {
        return this.history[this.history.length - 1].state;
    }

    constructor(private context: StateContext) {
        const rootState = new RootState();
        rootState.context = context;
        rootState.onActive();
        this.history.push({ state: rootState });
    }

    /**
     * Pushes a new state to the top of our state stack. Cause the currently
     * active state before the push is perfomed to be set as inactive.
     * @param state The new state to push and set as active
     */
    push(state: InteractionState, onPop?: (value: unknown) => void) {
        console.log("Pushing state: ", state.constructor.name);
        this.history[this.history.length - 1].state.onInactive();
        // Create a pop completer that can we awaited to wait for a result
        // This enables awaiting this function and resume with a value
        this.history.push({
            state,
            onPop,
        });
        state.context = this.context;
        state.onActive();
    }

    /**
     * Replaces the currently active state with the provided state.
     * Will call onInactive on the state to be replaced after removing it from
     * the stack
     * @param state the state to replace the current state with
     */
    replace(state: InteractionState) {
        if (this.history.length == 1) {
            throw Error("Cannot replace root state");
        }
        console.log("replacing state: ", state.constructor.name);
        // Pop the current state. Both to remove and to get a reference to it
        const replacedState = this.history.pop();
        // Set it to inactive
        replacedState?.state.onInactive();
        // Push the new state and set it to active
        this.history.push({ state });
        state.context = this.context;
        state.onActive();
    }

    /**
     * Pops the stack of the currenly active state causing the previous state
     * to become active
     */
    pop(value?: unknown) {
        if (this.history.length == 1) {
            throw Error("Cannot pop root state");
        }
        console.log("popping state");
        const poppedState = this.history.pop();
        poppedState?.state.onInactive();
        this.history[this.history.length - 1].state.onActive();
        const popCallback = poppedState?.onPop;
        if (popCallback) {
            popCallback(value);
        }
    }

    /**
     * Clears all currently pushed states and resets to the RootState
     */
    clear() {
        const items = this.history.length;
        for (let i = items; i > 1; i--) {
            const item = this.history.pop();
            item?.state.onInactive();
        }
        this.history[0].state.onActive();
    }
}

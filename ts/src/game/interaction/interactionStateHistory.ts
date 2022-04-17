import { InteractionState } from "./interactionState";
import { InteractionStateChanger } from "./interactionStateChanger";
import { RootState } from "./state/rootState";

/**
 * The InteractionStateHistory contains a stack of InteractionStates that
 * is active or have been active. This enables us to have a back functionality
 * if we show a menu or a specific UI state.
 */
export class InteractionStateHistory implements InteractionStateChanger {
    private history: InteractionState[] = [];

    /**
     * Retrieve the currently active interaction state
     */
    public get state(): InteractionState {
        return this.history[this.history.length - 1];
    }

    constructor() {
        const rootState = new RootState();
        this.history.push(rootState);
    }

    /**
     * Pushes a new state to the top of our state stack. Cause the currently
     * active state before the push is perfomed to be set as inactive.
     * @param state The new state to push and set as active
     */
    public push(state: InteractionState) {
        console.log("Pushing state: ", state.constructor.name);
        this.history[this.history.length - 1].onInactive();
        this.history.push(state);
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
        const replacedState = this.history.pop();
        replacedState?.onInactive();
        this.history.push(state);
        state.onActive();
    }

    /**
     * Pops the stack of the currenly active state causing the previous state
     * to become active
     */
    public pop() {
        if (this.history.length == 1) {
            throw Error("Cannot pop root state");
        }
        console.log("popping state");
        const poppedState = this.history.pop();
        poppedState?.onInactive();
        this.history[this.history.length - 1].onActive();
    }

    /**
     * Clears all currently pushed states and resets to the RootState
     */
    public clear() {
        const items = this.history.length;
        for (let i = items; i > 1; i--) {
            const item = this.history.pop();
            item?.onInactive();
        }
        this.history[0].onActive();
    }
}

/**
 * Represents a simplified world state for GOAP planning.
 * World states are snapshots of the world used during planning to evaluate
 * whether goals are satisfied and what effects actions would have.
 *
 * This is intentionally kept simple - it's a key-value map where:
 * - Keys are state variable names (e.g., "hasFood", "hunger", "atLocation")
 * - Values are boolean, number, or string representations of state
 *
 * We use strings for all values to make comparison simple and avoid
 * complex object equality checks. Actions and goals convert their
 * domain-specific state into these string representations.
 */
export type GoapWorldState = Map<string, string>;

/**
 * Create an empty world state.
 */
export function createWorldState(): GoapWorldState {
    return new Map();
}

/**
 * Set a state variable to a value.
 * Values are converted to strings for consistent comparison.
 */
export function setState(
    state: GoapWorldState,
    key: string,
    value: boolean | number | string,
): void {
    state.set(key, String(value));
}

/**
 * Get a state variable value.
 * Returns undefined if the key doesn't exist.
 */
export function getState(
    state: GoapWorldState,
    key: string,
): string | undefined {
    return state.get(key);
}

/**
 * Check if two world states are equal.
 * Two states are equal if they have the same keys with the same values.
 *
 * This is used for the closed set in A* search - if we've already
 * evaluated a world state, we don't need to evaluate it again.
 */
export function worldStatesEqual(a: GoapWorldState, b: GoapWorldState): boolean {
    if (a.size !== b.size) {
        return false;
    }

    for (const [key, value] of a) {
        if (b.get(key) !== value) {
            return false;
        }
    }

    return true;
}

/**
 * Clone a world state.
 * This is needed because actions modify states during planning,
 * and we don't want to modify the original state.
 */
export function cloneWorldState(state: GoapWorldState): GoapWorldState {
    return new Map(state);
}

/**
 * Apply effects to a world state, creating a new state.
 * Effects are changes that an action would make to the world.
 *
 * @param state - The current world state
 * @param effects - Map of state changes to apply
 * @returns A new world state with effects applied
 */
export function applyEffects(
    state: GoapWorldState,
    effects: GoapWorldState,
): GoapWorldState {
    const newState = cloneWorldState(state);

    for (const [key, value] of effects) {
        newState.set(key, value);
    }

    return newState;
}

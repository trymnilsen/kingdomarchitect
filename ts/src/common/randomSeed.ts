/**
 * Produces a fresh, non-deterministic seed for cases where reproducibility is
 * not required up front, such as a "randomize" control in a dev tool. Anything
 * that must be reproducible should thread a stored seed through instead.
 */
export function randomSeed(): number {
    return Math.floor(Math.random() * 0xffffffff);
}

export type RateLimiter = {
    /** Returns true if the request should be allowed, false if rate-limited */
    check(key: string): boolean;
    /** Reset all tracking state */
    reset(): void;
};

/**
 * Creates a sliding-window rate limiter. Each call to check() records a
 * timestamp for the given key and prunes expired entries. Returns false
 * when the key has exceeded maxRequests within windowMs.
 */
export function createRateLimiter(
    windowMs: number,
    maxRequests: number,
): RateLimiter {
    const requests = new Map<string, number[]>();

    return {
        check(key: string): boolean {
            const now = Date.now();
            const cutoff = now - windowMs;

            let timestamps = requests.get(key);
            if (!timestamps) {
                timestamps = [];
                requests.set(key, timestamps);
            }

            // Prune expired entries
            const firstValid = timestamps.findIndex((t) => t > cutoff);
            if (firstValid > 0) {
                timestamps.splice(0, firstValid);
            } else if (firstValid === -1) {
                timestamps.length = 0;
            }

            if (timestamps.length >= maxRequests) {
                return false;
            }

            timestamps.push(now);
            return true;
        },

        reset(): void {
            requests.clear();
        },
    };
}

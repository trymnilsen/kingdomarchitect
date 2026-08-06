type PendingChallenge = {
    challenge: string;
    expires: number;
};

const DEFAULT_CHALLENGE_TTL_MS = 120_000;

/**
 * Holds the short-lived challenges issued at the start of a ceremony.
 *
 * Challenges are server-local and never persisted, so a class is appropriate
 * here. A single server process owns the whole ceremony, and a challenge that
 * outlives a restart would be a replay window rather than a convenience.
 *
 * `consume` deletes on read. Single use is what makes a captured response
 * worthless to an attacker, so nothing in this class hands the same challenge
 * out twice.
 */
export class ChallengeStore {
    private readonly challenges = new Map<string, PendingChallenge>();
    private readonly ttlMs: number;

    /**
     * @param ttlMs Lifetime of an issued challenge. Injectable so tests can
     * drive expiry without sleeping.
     */
    constructor(ttlMs: number = DEFAULT_CHALLENGE_TTL_MS) {
        this.ttlMs = ttlMs;
    }

    store(key: string, challenge: string): void {
        // Opportunistically prune expired entries on every write
        this.cleanExpired();
        this.challenges.set(key, {
            challenge,
            expires: Date.now() + this.ttlMs,
        });
    }

    consume(key: string): string | null {
        const entry = this.challenges.get(key);
        if (!entry) {
            return null;
        }
        this.challenges.delete(key);
        if (entry.expires < Date.now()) {
            return null;
        }
        return entry.challenge;
    }

    private cleanExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.challenges.entries()) {
            if (entry.expires < now) {
                this.challenges.delete(key);
            }
        }
    }
}

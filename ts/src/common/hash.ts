/**
 * Generates a 53-bit hash from a string using a MurmurHash3-inspired algorithm.
 * Provides good distribution with low collision probability.
 *
 * @param str The string to hash
 * @returns A hash value as a number (safe integer range)
 */
export function hash53(str: string): number {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;

    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 3266489909);

    // Combine into 53-bit space (JavaScript's safe integer range)
    const hash = 4294967296 * (2097151 & h2) + (h1 >>> 0);

    return hash;
}

/**
 * Generates a base36-encoded hash string from input data.
 * Useful for creating compact, deterministic identifiers.
 *
 * @param data The data to hash (will be JSON stringified)
 * @returns A base36-encoded hash string
 */
export function hashToString(data: unknown): string {
    const str = typeof data === "string" ? data : JSON.stringify(data);
    return hash53(str).toString(36);
}

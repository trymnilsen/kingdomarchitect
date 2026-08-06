/**
 * WebAuthn sends every binary field as base64url inside JSON, so decoding is
 * the first thing every verification step does.
 *
 * Node's base64url decoder is lenient. It silently ignores characters outside
 * the alphabet instead of throwing, which means a malformed field arrives as a
 * short buffer rather than an error. Callers must treat a decoded value as
 * untrusted input and check its length before using it.
 */
export function base64UrlToBytes(value: string): Uint8Array {
    return new Uint8Array(Buffer.from(value, "base64url"));
}

export function bytesToBase64Url(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString("base64url");
}

/**
 * Decodes a field that arrived over the wire, rejecting anything that is not a
 * non-empty string. Returns null so callers can fail the whole request without
 * a try/catch around every field.
 */
export function decodeRequiredBase64Url(value: unknown): Uint8Array | null {
    if (typeof value !== "string" || value.length === 0) {
        return null;
    }
    const bytes = base64UrlToBytes(value);
    if (bytes.length === 0) {
        return null;
    }
    return bytes;
}

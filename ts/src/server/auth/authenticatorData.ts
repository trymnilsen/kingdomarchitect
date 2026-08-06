import { createHash } from "node:crypto";

/**
 * The fixed-size header the authenticator signs over. Everything we need sits
 * in the first 37 bytes, which is why this server never decodes CBOR. The
 * variable-length tail (attested credential data, extensions) is only present
 * during registration, and the browser hands us the credential id and public
 * key separately so we never have to parse it.
 */
export type AuthenticatorData = {
    rpIdHash: Uint8Array;
    userPresent: boolean;
    userVerified: boolean;
    signCount: number;
};

const RP_ID_HASH_LENGTH = 32;
const FLAGS_OFFSET = 32;
const SIGN_COUNT_OFFSET = 33;
const HEADER_LENGTH = 37;

const FLAG_USER_PRESENT = 0x01;
const FLAG_USER_VERIFIED = 0x04;

/**
 * Reads the authenticator data header. Returns null when the buffer is too
 * short to be well formed, which happens when a field was truncated in transit
 * or a caller passed a lenient base64url decode of garbage.
 */
export function parseAuthenticatorData(
    bytes: Uint8Array,
): AuthenticatorData | null {
    if (bytes.length < HEADER_LENGTH) {
        return null;
    }

    const flags = bytes[FLAGS_OFFSET]!;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    return {
        rpIdHash: bytes.slice(0, RP_ID_HASH_LENGTH),
        userPresent: (flags & FLAG_USER_PRESENT) !== 0,
        userVerified: (flags & FLAG_USER_VERIFIED) !== 0,
        signCount: view.getUint32(SIGN_COUNT_OFFSET, false),
    };
}

/**
 * Confirms the authenticator signed for our relying party and that a human
 * actually touched it.
 *
 * The rpIdHash check is the second half of the anti-phishing guarantee. The
 * origin check in clientData covers the page that made the call, and this
 * covers the scope the authenticator believed it was signing for.
 *
 * @param requireUserVerification Demands a PIN or biometric rather than a bare
 * presence tap. Callers pass false when the ceremony asked for "preferred",
 * because a hardware key without a PIN will legitimately omit the flag.
 */
export function verifyAuthenticatorData(
    data: AuthenticatorData,
    expectedRpId: string,
    requireUserVerification: boolean,
): boolean {
    const expectedHash = createHash("sha256").update(expectedRpId).digest();
    if (!Buffer.from(data.rpIdHash).equals(expectedHash)) {
        return false;
    }

    if (!data.userPresent) {
        return false;
    }

    if (requireUserVerification && !data.userVerified) {
        return false;
    }

    return true;
}

/**
 * Detects a cloned authenticator by watching the monotonic counter go
 * backwards.
 *
 * Synced passkeys (iCloud Keychain, Google Password Manager) always report 0
 * because the credential lives on several devices by design. A counter of zero
 * on both sides therefore means "not supported" and passes. Once an
 * authenticator has proven it counts, we hold it to that.
 */
export function isCounterAcceptable(
    storedCount: number,
    receivedCount: number,
): boolean {
    if (storedCount === 0 && receivedCount === 0) {
        return true;
    }
    return receivedCount > storedCount;
}

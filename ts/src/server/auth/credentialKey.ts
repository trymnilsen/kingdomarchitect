import { createPublicKey, verify, type KeyObject } from "node:crypto";

/**
 * COSE algorithm identifiers, as reported by the browser's
 * `getPublicKeyAlgorithm()`.
 *
 * ES256 covers platform authenticators on macOS, iOS and Android plus most
 * hardware keys. RS256 is here because Windows Hello issues RSA keys through
 * the TPM, and dropping it would lock out Windows users entirely.
 */
export const COSE_ALGORITHM_ES256 = -7;
export const COSE_ALGORITHM_RS256 = -257;

export const SUPPORTED_ALGORITHMS = [
    COSE_ALGORITHM_ES256,
    COSE_ALGORITHM_RS256,
];

export function isSupportedAlgorithm(algorithm: number): boolean {
    return SUPPORTED_ALGORITHMS.includes(algorithm);
}

/**
 * Imports a SubjectPublicKeyInfo DER blob, the format the browser hands back
 * from `getPublicKey()`. Returns null for anything malformed or for a key whose
 * real shape disagrees with the algorithm the client declared.
 *
 * The cross-check matters because the algorithm arrives as a separate JSON
 * field from the key bytes. Without it a caller could pair an RSA key with the
 * ES256 identifier and push the mismatch down into the verifier.
 */
export function importCredentialKey(
    spki: Uint8Array,
    algorithm: number,
): KeyObject | null {
    let key: KeyObject;
    try {
        key = createPublicKey({
            key: Buffer.from(spki),
            format: "der",
            type: "spki",
        });
    } catch {
        return null;
    }

    if (algorithm === COSE_ALGORITHM_ES256) {
        if (key.asymmetricKeyType !== "ec") {
            return null;
        }
        // ES256 is P-256 by definition. A P-384 key would verify against a
        // SHA-256 digest without complaint, so pin the curve here.
        if (key.asymmetricKeyDetails?.namedCurve !== "prime256v1") {
            return null;
        }
        return key;
    }

    if (algorithm === COSE_ALGORITHM_RS256) {
        if (key.asymmetricKeyType !== "rsa") {
            return null;
        }
        return key;
    }

    return null;
}

/**
 * Checks the assertion signature over `authenticatorData ‖ sha256(clientDataJSON)`.
 *
 * Node accepts the ASN.1 DER signature an ES256 authenticator produces without
 * conversion, and defaults RSA keys to the PKCS#1 v1.5 padding RS256 requires.
 * That is the whole reason this file has no ASN.1 handling of its own.
 */
export function verifyCredentialSignature(
    key: KeyObject,
    signedData: Uint8Array,
    signature: Uint8Array,
): boolean {
    try {
        return verify(
            "sha256",
            Buffer.from(signedData),
            key,
            Buffer.from(signature),
        );
    } catch {
        return false;
    }
}

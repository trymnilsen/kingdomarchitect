import { createHash, randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import {
    isCounterAcceptable,
    parseAuthenticatorData,
    verifyAuthenticatorData,
} from "./authenticatorData.ts";
import { bytesToBase64Url, decodeRequiredBase64Url } from "./base64url.ts";
import type { ChallengeStore } from "./challengeStore.ts";
import { verifyClientData } from "./clientData.ts";
import {
    importCredentialKey,
    isSupportedAlgorithm,
    SUPPORTED_ALGORITHMS,
    verifyCredentialSignature,
} from "./credentialKey.ts";
import {
    findCredential,
    findCredentialsForPlayer,
    insertCredential,
    updateCredentialCounter,
} from "./credentialStore.ts";

export type PasskeyConfig = {
    rpName: string;
    rpId: string;
    expectedOrigin: string;
};

const CHALLENGE_BYTES = 32;
const CEREMONY_TIMEOUT_MS = 60_000;

/**
 * We ask for user verification but do not require it. A hardware key with no
 * PIN configured omits the UV flag legitimately, and rejecting those would turn
 * a working authenticator into an unexplained failure.
 */
const REQUIRE_USER_VERIFICATION = false;

type CredentialDescriptor = {
    type: "public-key";
    id: string;
    transports?: string[];
};

export type RegistrationOptions = {
    rp: { name: string; id: string };
    user: { id: string; name: string; displayName: string };
    challenge: string;
    pubKeyCredParams: { type: "public-key"; alg: number }[];
    timeout: number;
    attestation: "none";
    excludeCredentials: CredentialDescriptor[];
    authenticatorSelection: {
        residentKey: "preferred";
        userVerification: "preferred";
    };
};

export type AuthenticationOptions = {
    challenge: string;
    timeout: number;
    rpId: string;
    allowCredentials: CredentialDescriptor[];
    userVerification: "preferred";
};

/**
 * The registration fields the client reads off `PublicKeyCredential` and posts
 * back, all binary values base64url encoded.
 *
 * `publicKey` and `publicKeyAlgorithm` come from `getPublicKey()` and
 * `getPublicKeyAlgorithm()`, and `authenticatorData` from
 * `getAuthenticatorData()`. Taking those three from the browser is what keeps
 * the attestation object, and therefore CBOR, off the server.
 *
 * These values are unverified client input. That is not a weakening: under
 * `attestation: "none"` the same bytes inside an attestation object carry no
 * signature either. What binds the account to the authenticator is that every
 * later login must produce a signature this key validates.
 */
export type RegistrationResponse = {
    id: string;
    response: {
        clientDataJSON: string;
        authenticatorData: string;
        publicKey: string;
        publicKeyAlgorithm: number;
        transports?: string[];
    };
};

/**
 * The assertion fields the client reads off `AuthenticatorAssertionResponse`.
 */
export type AuthenticationResponse = {
    id: string;
    response: {
        clientDataJSON: string;
        authenticatorData: string;
        signature: string;
    };
};

function registrationChallengeKey(playerId: string): string {
    return `reg:${playerId}`;
}

function authenticationChallengeKey(playerId: string): string {
    return `auth:${playerId}`;
}

function createChallenge(): string {
    return bytesToBase64Url(new Uint8Array(randomBytes(CHALLENGE_BYTES)));
}

function toDescriptor(
    credentialId: string,
    transports: string[],
): CredentialDescriptor {
    if (transports.length === 0) {
        return { type: "public-key", id: credentialId };
    }
    return { type: "public-key", id: credentialId, transports };
}

/**
 * Builds the options for creating a new passkey.
 *
 * `excludeCredentials` lists what the player already has so the authenticator
 * refuses to enroll a second credential for the same account instead of
 * silently stacking them up.
 */
export function generateRegistrationOptions(
    db: DatabaseSync,
    playerId: string,
    config: PasskeyConfig,
    challenges: ChallengeStore,
): RegistrationOptions {
    const existing = findCredentialsForPlayer(db, playerId);
    const challenge = createChallenge();

    challenges.store(registrationChallengeKey(playerId), challenge);

    return {
        rp: { name: config.rpName, id: config.rpId },
        user: {
            // The user handle must stay stable across re-registrations, or a
            // discoverable credential shows up as a separate account in the
            // authenticator's list every time.
            id: bytesToBase64Url(new Uint8Array(Buffer.from(playerId, "utf8"))),
            name: playerId,
            displayName: playerId,
        },
        challenge,
        pubKeyCredParams: SUPPORTED_ALGORITHMS.map((alg) => ({
            type: "public-key",
            alg,
        })),
        timeout: CEREMONY_TIMEOUT_MS,
        attestation: "none",
        excludeCredentials: existing.map((credential) =>
            toDescriptor(credential.credentialId, credential.transports),
        ),
        authenticatorSelection: {
            residentKey: "preferred",
            userVerification: "preferred",
        },
    };
}

/**
 * Verifies a registration ceremony and stores the credential.
 *
 * The challenge is consumed before anything else so that a failed attempt still
 * burns it. Leaving it alive on the error paths would let an attacker retry a
 * captured response until one of the later checks happened to pass.
 */
export function verifyRegistration(
    db: DatabaseSync,
    playerId: string,
    response: RegistrationResponse,
    config: PasskeyConfig,
    challenges: ChallengeStore,
): boolean {
    const expectedChallenge = challenges.consume(
        registrationChallengeKey(playerId),
    );
    if (!expectedChallenge) {
        return false;
    }

    if (typeof response.id !== "string" || response.id.length === 0) {
        return false;
    }

    const clientDataJson = decodeRequiredBase64Url(
        response.response?.clientDataJSON,
    );
    const authenticatorDataBytes = decodeRequiredBase64Url(
        response.response?.authenticatorData,
    );
    const publicKeySpki = decodeRequiredBase64Url(response.response?.publicKey);
    if (!clientDataJson || !authenticatorDataBytes || !publicKeySpki) {
        return false;
    }

    const algorithm = response.response.publicKeyAlgorithm;
    if (typeof algorithm !== "number" || !isSupportedAlgorithm(algorithm)) {
        return false;
    }

    if (
        !verifyClientData(
            clientDataJson,
            "webauthn.create",
            expectedChallenge,
            config.expectedOrigin,
        )
    ) {
        return false;
    }

    const authenticatorData = parseAuthenticatorData(authenticatorDataBytes);
    if (!authenticatorData) {
        return false;
    }

    if (
        !verifyAuthenticatorData(
            authenticatorData,
            config.rpId,
            REQUIRE_USER_VERIFICATION,
        )
    ) {
        return false;
    }

    // Import now rather than at first login. A key we cannot parse is a
    // credential the player could never authenticate with.
    if (!importCredentialKey(publicKeySpki, algorithm)) {
        return false;
    }

    return insertCredential(db, {
        credentialId: response.id,
        playerId,
        publicKey: publicKeySpki,
        algorithm,
        counter: authenticatorData.signCount,
        transports: Array.isArray(response.response.transports)
            ? response.response.transports.filter(
                  (entry) => typeof entry === "string",
              )
            : [],
    });
}

/**
 * Builds the options for asserting an existing passkey.
 */
export function generateAuthenticationOptions(
    db: DatabaseSync,
    playerId: string,
    config: PasskeyConfig,
    challenges: ChallengeStore,
): AuthenticationOptions {
    const credentials = findCredentialsForPlayer(db, playerId);
    const challenge = createChallenge();

    challenges.store(authenticationChallengeKey(playerId), challenge);

    return {
        challenge,
        timeout: CEREMONY_TIMEOUT_MS,
        rpId: config.rpId,
        allowCredentials: credentials.map((credential) =>
            toDescriptor(credential.credentialId, credential.transports),
        ),
        userVerification: "preferred",
    };
}

/**
 * Verifies an assertion and advances the stored signature counter.
 *
 * The signature covers the authenticator data concatenated with the SHA-256 of
 * the client data. Both halves have already been checked on their own by this
 * point, so the signature is what proves those checked bytes came from the
 * enrolled authenticator rather than from the caller.
 */
export function verifyAuthentication(
    db: DatabaseSync,
    playerId: string,
    response: AuthenticationResponse,
    config: PasskeyConfig,
    challenges: ChallengeStore,
): boolean {
    const expectedChallenge = challenges.consume(
        authenticationChallengeKey(playerId),
    );
    if (!expectedChallenge) {
        return false;
    }

    if (typeof response.id !== "string" || response.id.length === 0) {
        return false;
    }

    const clientDataJson = decodeRequiredBase64Url(
        response.response?.clientDataJSON,
    );
    const authenticatorDataBytes = decodeRequiredBase64Url(
        response.response?.authenticatorData,
    );
    const signature = decodeRequiredBase64Url(response.response?.signature);
    if (!clientDataJson || !authenticatorDataBytes || !signature) {
        return false;
    }

    const stored = findCredential(db, response.id, playerId);
    if (!stored) {
        return false;
    }

    if (
        !verifyClientData(
            clientDataJson,
            "webauthn.get",
            expectedChallenge,
            config.expectedOrigin,
        )
    ) {
        return false;
    }

    const authenticatorData = parseAuthenticatorData(authenticatorDataBytes);
    if (!authenticatorData) {
        return false;
    }

    if (
        !verifyAuthenticatorData(
            authenticatorData,
            config.rpId,
            REQUIRE_USER_VERIFICATION,
        )
    ) {
        return false;
    }

    if (!isCounterAcceptable(stored.counter, authenticatorData.signCount)) {
        return false;
    }

    const key = importCredentialKey(stored.publicKey, stored.algorithm);
    if (!key) {
        return false;
    }

    const clientDataHash = createHash("sha256").update(clientDataJson).digest();
    const signedData = Buffer.concat([
        Buffer.from(authenticatorDataBytes),
        clientDataHash,
    ]);

    if (!verifyCredentialSignature(key, signedData, signature)) {
        return false;
    }

    updateCredentialCounter(
        db,
        stored.credentialId,
        authenticatorData.signCount,
    );
    return true;
}

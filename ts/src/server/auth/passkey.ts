import type { DatabaseSync } from "node:sqlite";
import {
    generateRegistrationOptions as webauthnGenerateRegistration,
    verifyRegistrationResponse,
    generateAuthenticationOptions as webauthnGenerateAuthentication,
    verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
    RegistrationResponseJSON,
    AuthenticationResponseJSON,
    AuthenticatorTransportFuture,
    WebAuthnCredential,
} from "@simplewebauthn/server";

type PendingChallenge = {
    challenge: string;
    expires: number;
};

const CHALLENGE_TTL_MS = 120_000; // 2 minutes

/**
 * In-memory storage for short-lived WebAuthn challenges.
 * Challenges are server-local and never persisted, so a class is appropriate here.
 */
export class ChallengeStore {
    private readonly challenges = new Map<string, PendingChallenge>();

    store(key: string, challenge: string): void {
        // Opportunistically prune expired entries on every write
        this.cleanExpired();
        this.challenges.set(key, {
            challenge,
            expires: Date.now() + CHALLENGE_TTL_MS,
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

export type PasskeyConfig = {
    rpName: string;
    rpId: string;
    expectedOrigin: string;
};

type CredentialRow = {
    credential_id: string;
    player_id: string;
    public_key: Buffer;
    counter: number;
    transports: string | null;
};

function getCredentialsForPlayer(
    db: DatabaseSync,
    playerId: string,
): CredentialRow[] {
    return db
        .prepare("SELECT * FROM credentials WHERE player_id = ?")
        .all(playerId) as CredentialRow[];
}

function rowToWebAuthnCredential(row: CredentialRow): WebAuthnCredential {
    return {
        id: row.credential_id,
        publicKey: new Uint8Array(row.public_key),
        counter: row.counter,
        transports: row.transports
            ? (JSON.parse(row.transports) as AuthenticatorTransportFuture[])
            : undefined,
    };
}

/**
 * Generates registration options for a new passkey credential.
 */
export async function generateRegistrationOpts(
    db: DatabaseSync,
    playerId: string,
    config: PasskeyConfig,
    challenges: ChallengeStore,
): Promise<ReturnType<typeof webauthnGenerateRegistration>> {
    const existingCredentials = getCredentialsForPlayer(db, playerId);

    const options = await webauthnGenerateRegistration({
        rpName: config.rpName,
        rpID: config.rpId,
        userName: playerId,
        excludeCredentials: existingCredentials.map((c) => ({
            id: c.credential_id,
            transports: c.transports
                ? (JSON.parse(c.transports) as AuthenticatorTransportFuture[])
                : undefined,
        })),
    });

    challenges.store(`reg:${playerId}`, options.challenge);
    return options;
}

/**
 * Verifies a registration response and stores the new credential.
 */
export async function verifyRegistration(
    db: DatabaseSync,
    playerId: string,
    response: RegistrationResponseJSON,
    config: PasskeyConfig,
    challenges: ChallengeStore,
): Promise<boolean> {
    const expectedChallenge = challenges.consume(`reg:${playerId}`);
    if (!expectedChallenge) {
        return false;
    }

    const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: config.expectedOrigin,
        expectedRPID: config.rpId,
    });

    if (!verification.verified || !verification.registrationInfo) {
        return false;
    }

    const { credential } = verification.registrationInfo;

    db.prepare(
        `INSERT INTO credentials (credential_id, player_id, public_key, counter, transports)
         VALUES (?, ?, ?, ?, ?)`,
    ).run(
        credential.id,
        playerId,
        Buffer.from(credential.publicKey),
        credential.counter,
        credential.transports ? JSON.stringify(credential.transports) : null,
    );

    return true;
}

/**
 * Generates authentication options for an existing player.
 */
export async function generateAuthenticationOpts(
    db: DatabaseSync,
    playerId: string,
    config: PasskeyConfig,
    challenges: ChallengeStore,
): Promise<ReturnType<typeof webauthnGenerateAuthentication>> {
    const credentials = getCredentialsForPlayer(db, playerId);

    const options = await webauthnGenerateAuthentication({
        rpID: config.rpId,
        allowCredentials: credentials.map((c) => ({
            id: c.credential_id,
            transports: c.transports
                ? (JSON.parse(c.transports) as AuthenticatorTransportFuture[])
                : undefined,
        })),
    });

    challenges.store(`auth:${playerId}`, options.challenge);
    return options;
}

/**
 * Verifies an authentication response and updates the credential counter.
 */
export async function verifyAuthentication(
    db: DatabaseSync,
    playerId: string,
    response: AuthenticationResponseJSON,
    config: PasskeyConfig,
    challenges: ChallengeStore,
): Promise<boolean> {
    const expectedChallenge = challenges.consume(`auth:${playerId}`);
    if (!expectedChallenge) {
        return false;
    }

    // Find the credential being used
    const credRow = db
        .prepare(
            "SELECT * FROM credentials WHERE credential_id = ? AND player_id = ?",
        )
        .get(response.id, playerId) as CredentialRow | undefined;

    if (!credRow) {
        return false;
    }

    const credential = rowToWebAuthnCredential(credRow);

    const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: config.expectedOrigin,
        expectedRPID: config.rpId,
        credential,
    });

    if (!verification.verified) {
        return false;
    }

    // Update counter to prevent replay attacks
    db.prepare("UPDATE credentials SET counter = ? WHERE credential_id = ?").run(
        verification.authenticationInfo.newCounter,
        response.id,
    );

    return true;
}

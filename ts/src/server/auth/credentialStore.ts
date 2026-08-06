import type { DatabaseSync } from "node:sqlite";

/**
 * A registered passkey as the server keeps it.
 *
 * `publicKey` holds SubjectPublicKeyInfo DER rather than the COSE key the
 * WebAuthn spec describes. The browser already hands us SPKI through
 * `getPublicKey()`, and storing it in that form is what lets this server verify
 * assertions without a CBOR decoder.
 */
export type StoredCredential = {
    credentialId: string;
    playerId: string;
    publicKey: Uint8Array;
    algorithm: number;
    counter: number;
    transports: string[];
};

type CredentialRow = {
    credential_id: string;
    player_id: string;
    public_key: Uint8Array;
    algorithm: number;
    counter: number;
    transports: string | null;
};

function rowToCredential(row: CredentialRow): StoredCredential {
    return {
        credentialId: row.credential_id,
        playerId: row.player_id,
        publicKey: new Uint8Array(row.public_key),
        algorithm: row.algorithm,
        counter: row.counter,
        transports: parseTransports(row.transports),
    };
}

/**
 * Transports are a hint we echo back in `allowCredentials` so the browser can
 * prompt for the right authenticator. A malformed value costs the user a
 * slightly worse prompt, so it degrades to empty rather than failing the login.
 */
function parseTransports(value: string | null): string[] {
    if (!value) {
        return [];
    }
    try {
        const parsed: unknown = JSON.parse(value);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.filter((entry) => typeof entry === "string");
    } catch {
        return [];
    }
}

export function findCredentialsForPlayer(
    db: DatabaseSync,
    playerId: string,
): StoredCredential[] {
    const rows = db
        .prepare("SELECT * FROM credentials WHERE player_id = ?")
        .all(playerId) as CredentialRow[];
    return rows.map(rowToCredential);
}

/**
 * Looks up a credential scoped to its owner. The player id is part of the
 * lookup so a credential cannot be used to assert a different account, even
 * though the credential id alone is unique.
 */
export function findCredential(
    db: DatabaseSync,
    credentialId: string,
    playerId: string,
): StoredCredential | null {
    const row = db
        .prepare(
            "SELECT * FROM credentials WHERE credential_id = ? AND player_id = ?",
        )
        .get(credentialId, playerId) as CredentialRow | undefined;

    if (!row) {
        return null;
    }
    return rowToCredential(row);
}

/**
 * Stores a newly registered credential. Returns false when the credential id
 * is already taken, which is how a replayed registration is turned away.
 */
export function insertCredential(
    db: DatabaseSync,
    credential: StoredCredential,
): boolean {
    try {
        db.prepare(
            `INSERT INTO credentials (credential_id, player_id, public_key, algorithm, counter, transports)
             VALUES (?, ?, ?, ?, ?, ?)`,
        ).run(
            credential.credentialId,
            credential.playerId,
            Buffer.from(credential.publicKey),
            credential.algorithm,
            credential.counter,
            credential.transports.length > 0
                ? JSON.stringify(credential.transports)
                : null,
        );
        return true;
    } catch {
        return false;
    }
}

export function updateCredentialCounter(
    db: DatabaseSync,
    credentialId: string,
    counter: number,
): void {
    db.prepare("UPDATE credentials SET counter = ? WHERE credential_id = ?").run(
        counter,
        credentialId,
    );
}

import assert from "node:assert";
import {
    createHash,
    generateKeyPairSync,
    sign,
    type KeyObject,
} from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, it } from "node:test";
import { authMigrations } from "../../../src/server/auth/authSchema.ts";
import { ChallengeStore } from "../../../src/server/auth/challengeStore.ts";
import {
    COSE_ALGORITHM_ES256,
    COSE_ALGORITHM_RS256,
} from "../../../src/server/auth/credentialKey.ts";
import {
    generateAuthenticationOptions,
    generateRegistrationOptions,
    verifyAuthentication,
    verifyRegistration,
    type AuthenticationResponse,
    type PasskeyConfig,
    type RegistrationResponse,
} from "../../../src/server/auth/passkey.ts";
import { gameMigrations } from "../../../src/server/persistence/migration.ts";
import { applySQLiteMigrations } from "../../../src/server/persistence/sqliteMigrationCompiler.ts";

const config: PasskeyConfig = {
    rpName: "Kingdom Architect",
    rpId: "play.kingdomarchitect.test",
    expectedOrigin: "https://play.kingdomarchitect.test",
};

const PLAYER = "player-7";
const OTHER_PLAYER = "player-9";

const FLAG_USER_PRESENT = 0x01;
const FLAG_USER_VERIFIED = 0x04;
const PRESENT_AND_VERIFIED = FLAG_USER_PRESENT | FLAG_USER_VERIFIED;

/**
 * Stands in for a real authenticator. Holds the private key so tests can
 * produce genuine signatures rather than asserting against canned bytes, which
 * is what makes the negative cases meaningful.
 */
type FakeAuthenticator = {
    credentialId: string;
    publicKeySpki: Uint8Array;
    algorithm: number;
    privateKey: KeyObject;
};

function createAuthenticator(
    credentialId: string,
    algorithm: number = COSE_ALGORITHM_ES256,
): FakeAuthenticator {
    if (algorithm === COSE_ALGORITHM_RS256) {
        const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
        return {
            credentialId,
            publicKeySpki: new Uint8Array(
                pair.publicKey.export({ format: "der", type: "spki" }),
            ),
            algorithm,
            privateKey: pair.privateKey,
        };
    }

    const pair = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    return {
        credentialId,
        publicKeySpki: new Uint8Array(
            pair.publicKey.export({ format: "der", type: "spki" }),
        ),
        algorithm,
        privateKey: pair.privateKey,
    };
}

function buildAuthenticatorData(
    rpId: string,
    flags: number,
    signCount: number,
): Uint8Array {
    const rpIdHash = createHash("sha256").update(rpId).digest();
    const tail = Buffer.alloc(5);
    tail.writeUInt8(flags, 0);
    tail.writeUInt32BE(signCount, 1);
    return new Uint8Array(Buffer.concat([rpIdHash, tail]));
}

function buildClientData(
    type: string,
    challenge: string,
    origin: string,
): Uint8Array {
    return new Uint8Array(
        Buffer.from(JSON.stringify({ type, challenge, origin }), "utf8"),
    );
}

function toBase64Url(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString("base64url");
}

function buildRegistration(
    authenticator: FakeAuthenticator,
    challenge: string,
    origin: string,
    rpId: string,
    flags: number,
    signCount: number,
): RegistrationResponse {
    return {
        id: authenticator.credentialId,
        response: {
            clientDataJSON: toBase64Url(
                buildClientData("webauthn.create", challenge, origin),
            ),
            authenticatorData: toBase64Url(
                buildAuthenticatorData(rpId, flags, signCount),
            ),
            publicKey: toBase64Url(authenticator.publicKeySpki),
            publicKeyAlgorithm: authenticator.algorithm,
            transports: ["internal"],
        },
    };
}

/**
 * Produces an assertion the way an authenticator does, signing over the
 * authenticator data joined to the client data hash.
 *
 * @param signingKey Defaults to the authenticator's own key. Tests override it
 * to prove that a signature from an unrelated key is rejected.
 * @param signedAuthenticatorData Defaults to the data actually sent. Tests
 * override it to sign one payload and transmit another.
 */
function buildAssertion(
    authenticator: FakeAuthenticator,
    challenge: string,
    origin: string,
    rpId: string,
    flags: number,
    signCount: number,
    clientDataType: string = "webauthn.get",
    signingKey?: KeyObject,
    signedAuthenticatorData?: Uint8Array,
): AuthenticationResponse {
    const clientDataJson = buildClientData(clientDataType, challenge, origin);
    const authenticatorData = buildAuthenticatorData(rpId, flags, signCount);
    const payload = Buffer.concat([
        Buffer.from(signedAuthenticatorData ?? authenticatorData),
        createHash("sha256").update(clientDataJson).digest(),
    ]);
    const signature = sign(
        "sha256",
        payload,
        signingKey ?? authenticator.privateKey,
    );

    return {
        id: authenticator.credentialId,
        response: {
            clientDataJSON: toBase64Url(clientDataJson),
            authenticatorData: toBase64Url(authenticatorData),
            signature: toBase64Url(new Uint8Array(signature)),
        },
    };
}

function createTestDb(): DatabaseSync {
    const db = new DatabaseSync(":memory:");
    applySQLiteMigrations(db, [...gameMigrations, ...authMigrations]);
    return db;
}

/**
 * Runs a full registration ceremony so authentication tests start from a
 * credential that was genuinely enrolled through the code under test.
 */
function registerAuthenticator(
    db: DatabaseSync,
    challenges: ChallengeStore,
    authenticator: FakeAuthenticator,
    playerId: string = PLAYER,
): boolean {
    const options = generateRegistrationOptions(
        db,
        playerId,
        config,
        challenges,
    );
    return verifyRegistration(
        db,
        playerId,
        buildRegistration(
            authenticator,
            options.challenge,
            config.expectedOrigin,
            config.rpId,
            PRESENT_AND_VERIFIED,
            0,
        ),
        config,
        challenges,
    );
}

describe("Passkey registration", () => {
    let db: DatabaseSync;
    let challenges: ChallengeStore;
    let authenticator: FakeAuthenticator;

    beforeEach(() => {
        db = createTestDb();
        challenges = new ChallengeStore();
        authenticator = createAuthenticator("credential-alpha");
    });

    it("enrolls a credential that can then authenticate", () => {
        assert.ok(registerAuthenticator(db, challenges, authenticator));

        const options = generateAuthenticationOptions(
            db,
            PLAYER,
            config,
            challenges,
        );
        const verified = verifyAuthentication(
            db,
            PLAYER,
            buildAssertion(
                authenticator,
                options.challenge,
                config.expectedOrigin,
                config.rpId,
                PRESENT_AND_VERIFIED,
                1,
            ),
            config,
            challenges,
        );

        assert.strictEqual(verified, true);
    });

    it("accepts an RS256 key, as Windows Hello issues", () => {
        const windowsHello = createAuthenticator(
            "credential-rsa",
            COSE_ALGORITHM_RS256,
        );
        assert.ok(registerAuthenticator(db, challenges, windowsHello));

        const options = generateAuthenticationOptions(
            db,
            PLAYER,
            config,
            challenges,
        );
        const verified = verifyAuthentication(
            db,
            PLAYER,
            buildAssertion(
                windowsHello,
                options.challenge,
                config.expectedOrigin,
                config.rpId,
                PRESENT_AND_VERIFIED,
                1,
            ),
            config,
            challenges,
        );

        assert.strictEqual(verified, true);
    });

    it("rejects a ceremony completed on a lookalike origin", () => {
        const options = generateRegistrationOptions(
            db,
            PLAYER,
            config,
            challenges,
        );
        const verified = verifyRegistration(
            db,
            PLAYER,
            buildRegistration(
                authenticator,
                options.challenge,
                "https://play.kingdomarchitect.test.evil.example",
                config.rpId,
                PRESENT_AND_VERIFIED,
                0,
            ),
            config,
            challenges,
        );

        assert.strictEqual(verified, false);
    });

    it("rejects a challenge the server never issued", () => {
        generateRegistrationOptions(db, PLAYER, config, challenges);
        const verified = verifyRegistration(
            db,
            PLAYER,
            buildRegistration(
                authenticator,
                "an-attacker-chosen-challenge",
                config.expectedOrigin,
                config.rpId,
                PRESENT_AND_VERIFIED,
                0,
            ),
            config,
            challenges,
        );

        assert.strictEqual(verified, false);
    });

    it("rejects authenticator data scoped to another relying party", () => {
        const options = generateRegistrationOptions(
            db,
            PLAYER,
            config,
            challenges,
        );
        const verified = verifyRegistration(
            db,
            PLAYER,
            buildRegistration(
                authenticator,
                options.challenge,
                config.expectedOrigin,
                "evil.example",
                PRESENT_AND_VERIFIED,
                0,
            ),
            config,
            challenges,
        );

        assert.strictEqual(verified, false);
    });

    it("rejects a ceremony with no user present", () => {
        const options = generateRegistrationOptions(
            db,
            PLAYER,
            config,
            challenges,
        );
        const verified = verifyRegistration(
            db,
            PLAYER,
            buildRegistration(
                authenticator,
                options.challenge,
                config.expectedOrigin,
                config.rpId,
                0,
                0,
            ),
            config,
            challenges,
        );

        assert.strictEqual(verified, false);
    });

    it("rejects an algorithm outside the advertised set", () => {
        const options = generateRegistrationOptions(
            db,
            PLAYER,
            config,
            challenges,
        );
        const response = buildRegistration(
            authenticator,
            options.challenge,
            config.expectedOrigin,
            config.rpId,
            PRESENT_AND_VERIFIED,
            0,
        );
        // EdDSA, which we never offer in pubKeyCredParams
        response.response.publicKeyAlgorithm = -8;

        assert.strictEqual(
            verifyRegistration(db, PLAYER, response, config, challenges),
            false,
        );
    });

    it("rejects a key whose type contradicts the declared algorithm", () => {
        const rsaKeyed = createAuthenticator(
            "credential-confused",
            COSE_ALGORITHM_RS256,
        );
        const options = generateRegistrationOptions(
            db,
            PLAYER,
            config,
            challenges,
        );
        const response = buildRegistration(
            rsaKeyed,
            options.challenge,
            config.expectedOrigin,
            config.rpId,
            PRESENT_AND_VERIFIED,
            0,
        );
        response.response.publicKeyAlgorithm = COSE_ALGORITHM_ES256;

        assert.strictEqual(
            verifyRegistration(db, PLAYER, response, config, challenges),
            false,
        );
    });

    it("burns the challenge even when verification fails", () => {
        const options = generateRegistrationOptions(
            db,
            PLAYER,
            config,
            challenges,
        );
        const goodResponse = buildRegistration(
            authenticator,
            options.challenge,
            config.expectedOrigin,
            config.rpId,
            PRESENT_AND_VERIFIED,
            0,
        );
        const badResponse = buildRegistration(
            authenticator,
            options.challenge,
            config.expectedOrigin,
            "evil.example",
            PRESENT_AND_VERIFIED,
            0,
        );

        assert.strictEqual(
            verifyRegistration(db, PLAYER, badResponse, config, challenges),
            false,
        );
        assert.strictEqual(
            verifyRegistration(db, PLAYER, goodResponse, config, challenges),
            false,
            "A spent challenge must not be reusable after a failed attempt",
        );
    });

    it("rejects an expired challenge", () => {
        const expiring = new ChallengeStore(-1);
        const options = generateRegistrationOptions(
            db,
            PLAYER,
            config,
            expiring,
        );
        const verified = verifyRegistration(
            db,
            PLAYER,
            buildRegistration(
                authenticator,
                options.challenge,
                config.expectedOrigin,
                config.rpId,
                PRESENT_AND_VERIFIED,
                0,
            ),
            config,
            expiring,
        );

        assert.strictEqual(verified, false);
    });

    it("refuses to enroll the same credential id twice", () => {
        assert.ok(registerAuthenticator(db, challenges, authenticator));
        assert.strictEqual(
            registerAuthenticator(db, challenges, authenticator),
            false,
        );
    });

    it("excludes already registered credentials from a new ceremony", () => {
        registerAuthenticator(db, challenges, authenticator);
        const options = generateRegistrationOptions(
            db,
            PLAYER,
            config,
            challenges,
        );

        assert.deepStrictEqual(options.excludeCredentials, [
            {
                type: "public-key",
                id: "credential-alpha",
                transports: ["internal"],
            },
        ]);
    });
});

describe("Passkey authentication", () => {
    let db: DatabaseSync;
    let challenges: ChallengeStore;
    let authenticator: FakeAuthenticator;

    beforeEach(() => {
        db = createTestDb();
        challenges = new ChallengeStore();
        authenticator = createAuthenticator("credential-alpha");
        registerAuthenticator(db, challenges, authenticator);
    });

    function issueChallenge(playerId: string = PLAYER): string {
        return generateAuthenticationOptions(db, playerId, config, challenges)
            .challenge;
    }

    it("rejects a signature made by a different key", () => {
        const impostor = createAuthenticator("credential-alpha");
        const verified = verifyAuthentication(
            db,
            PLAYER,
            buildAssertion(
                authenticator,
                issueChallenge(),
                config.expectedOrigin,
                config.rpId,
                PRESENT_AND_VERIFIED,
                1,
                "webauthn.get",
                impostor.privateKey,
            ),
            config,
            challenges,
        );

        assert.strictEqual(verified, false);
    });

    it("rejects authenticator data tampered with after signing", () => {
        const signedOver = buildAuthenticatorData(
            config.rpId,
            PRESENT_AND_VERIFIED,
            1,
        );
        // Signs over sign count 1 but transmits sign count 99
        const verified = verifyAuthentication(
            db,
            PLAYER,
            buildAssertion(
                authenticator,
                issueChallenge(),
                config.expectedOrigin,
                config.rpId,
                PRESENT_AND_VERIFIED,
                99,
                "webauthn.get",
                undefined,
                signedOver,
            ),
            config,
            challenges,
        );

        assert.strictEqual(verified, false);
    });

    it("rejects a replayed assertion", () => {
        const assertion = buildAssertion(
            authenticator,
            issueChallenge(),
            config.expectedOrigin,
            config.rpId,
            PRESENT_AND_VERIFIED,
            1,
        );

        assert.strictEqual(
            verifyAuthentication(db, PLAYER, assertion, config, challenges),
            true,
        );
        assert.strictEqual(
            verifyAuthentication(db, PLAYER, assertion, config, challenges),
            false,
            "The same assertion must not authenticate twice",
        );
    });

    it("rejects an assertion completed on a lookalike origin", () => {
        const verified = verifyAuthentication(
            db,
            PLAYER,
            buildAssertion(
                authenticator,
                issueChallenge(),
                "https://play.kingdomarchitect.test.evil.example",
                config.rpId,
                PRESENT_AND_VERIFIED,
                1,
            ),
            config,
            challenges,
        );

        assert.strictEqual(verified, false);
    });

    it("rejects a registration ceremony replayed as a login", () => {
        const verified = verifyAuthentication(
            db,
            PLAYER,
            buildAssertion(
                authenticator,
                issueChallenge(),
                config.expectedOrigin,
                config.rpId,
                PRESENT_AND_VERIFIED,
                1,
                "webauthn.create",
            ),
            config,
            challenges,
        );

        assert.strictEqual(verified, false);
    });

    it("rejects an assertion scoped to another relying party", () => {
        const verified = verifyAuthentication(
            db,
            PLAYER,
            buildAssertion(
                authenticator,
                issueChallenge(),
                config.expectedOrigin,
                "evil.example",
                PRESENT_AND_VERIFIED,
                1,
            ),
            config,
            challenges,
        );

        assert.strictEqual(verified, false);
    });

    it("rejects a credential registered to another player", () => {
        const verified = verifyAuthentication(
            db,
            OTHER_PLAYER,
            buildAssertion(
                authenticator,
                issueChallenge(OTHER_PLAYER),
                config.expectedOrigin,
                config.rpId,
                PRESENT_AND_VERIFIED,
                1,
            ),
            config,
            challenges,
        );

        assert.strictEqual(verified, false);
    });

    it("advances the stored counter and rejects it going backwards", () => {
        assert.strictEqual(
            verifyAuthentication(
                db,
                PLAYER,
                buildAssertion(
                    authenticator,
                    issueChallenge(),
                    config.expectedOrigin,
                    config.rpId,
                    PRESENT_AND_VERIFIED,
                    5,
                ),
                config,
                challenges,
            ),
            true,
        );

        const cloned = verifyAuthentication(
            db,
            PLAYER,
            buildAssertion(
                authenticator,
                issueChallenge(),
                config.expectedOrigin,
                config.rpId,
                PRESENT_AND_VERIFIED,
                4,
            ),
            config,
            challenges,
        );

        assert.strictEqual(
            cloned,
            false,
            "A counter below the stored value signals a cloned authenticator",
        );
    });

    it("allows a synced passkey that always reports zero", () => {
        for (let attempt = 0; attempt < 2; attempt++) {
            const verified = verifyAuthentication(
                db,
                PLAYER,
                buildAssertion(
                    authenticator,
                    issueChallenge(),
                    config.expectedOrigin,
                    config.rpId,
                    PRESENT_AND_VERIFIED,
                    0,
                ),
                config,
                challenges,
            );
            assert.strictEqual(
                verified,
                true,
                "iCloud and Google passkeys never increment the counter",
            );
        }
    });
});

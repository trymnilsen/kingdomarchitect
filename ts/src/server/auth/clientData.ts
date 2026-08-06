import { timingSafeEqual } from "node:crypto";

/**
 * Distinguishes a credential creation ceremony from an assertion ceremony.
 * The authenticator stamps this into clientDataJSON, and checking it stops a
 * registration response from being replayed as a login.
 */
export type ClientDataType = "webauthn.create" | "webauthn.get";

type ClientData = {
    type: unknown;
    challenge: unknown;
    origin: unknown;
    crossOrigin?: unknown;
};

/**
 * Validates the client data the browser signed over during a ceremony.
 *
 * These four checks are the whole anti-phishing story of WebAuthn. The origin
 * check is what stops a lookalike site from relaying a ceremony to us, and the
 * challenge check is what stops a captured response from being replayed. A
 * loosened comparison here (a prefix match on origin, for example) is an
 * authentication bypass, so both comparisons are exact.
 */
export function verifyClientData(
    clientDataJson: Uint8Array,
    expectedType: ClientDataType,
    expectedChallenge: string,
    expectedOrigin: string,
): boolean {
    let parsed: ClientData;
    try {
        parsed = JSON.parse(
            Buffer.from(clientDataJson).toString("utf8"),
        ) as ClientData;
    } catch {
        return false;
    }

    if (parsed === null || typeof parsed !== "object") {
        return false;
    }

    if (parsed.type !== expectedType) {
        return false;
    }

    if (parsed.origin !== expectedOrigin) {
        return false;
    }

    // Absent means same-origin. Only an explicit true is a cross-origin frame,
    // which we refuse because a framed ceremony can be driven by the embedder.
    if (parsed.crossOrigin === true) {
        return false;
    }

    if (typeof parsed.challenge !== "string") {
        return false;
    }

    return challengeMatches(parsed.challenge, expectedChallenge);
}

/**
 * Compares the returned challenge against the one we issued without leaking
 * how much of it matched through timing.
 */
function challengeMatches(received: string, expected: string): boolean {
    const receivedBytes = Buffer.from(received, "utf8");
    const expectedBytes = Buffer.from(expected, "utf8");
    if (receivedBytes.length !== expectedBytes.length) {
        return false;
    }
    return timingSafeEqual(receivedBytes, expectedBytes);
}

import { log } from "../../common/logging/logger.ts";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { DatabaseSync } from "node:sqlite";

import {
    parseJsonBody,
    BodyTooLargeError,
    InvalidJsonError,
} from "../http/bodyParser.ts";
import type { RateLimiter } from "../http/rateLimit.ts";
import { checkOrigin } from "../http/security.ts";
import { ChallengeStore } from "./challengeStore.ts";
import {
    generateRegistrationOptions,
    verifyRegistration,
    generateAuthenticationOptions,
    verifyAuthentication,
    type AuthenticationResponse,
    type PasskeyConfig,
    type RegistrationResponse,
} from "./passkey.ts";
import { createSession, deleteSession, parseCookies } from "./session.ts";

export type AuthConfig = PasskeyConfig & {
    sessionDurationMs: number;
};

const MAX_BODY_BYTES = 64 * 1024; // 64 KB

/**
 * WebAuthn caps the user handle at 64 bytes, and we derive that handle from the
 * player id. The limit is measured in bytes rather than characters because a
 * 64-character id with multi-byte characters would overflow the handle and be
 * rejected by the authenticator partway through registration.
 */
const MAX_PLAYER_ID_BYTES = 64;

function isValidPlayerId(playerId: unknown): playerId is string {
    return (
        typeof playerId === "string" &&
        playerId.length > 0 &&
        Buffer.byteLength(playerId, "utf8") <= MAX_PLAYER_ID_BYTES
    );
}

function buildSessionCookieHeader(
    sessionId: string,
    secure: boolean,
    clear?: boolean,
): string {
    const value = clear ? "" : sessionId;
    const securePart = secure ? "; Secure" : "";
    const maxAgePart = clear ? "; Max-Age=0" : "";
    return `session=${value}; HttpOnly; SameSite=Strict; Path=/${securePart}${maxAgePart}`;
}

function getClientIp(req: IncomingMessage): string {
    return req.socket.remoteAddress ?? "unknown";
}

function sendJson(
    res: ServerResponse,
    statusCode: number,
    data: unknown,
): void {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
}

function sendError(
    res: ServerResponse,
    statusCode: number,
    message: string,
): void {
    sendJson(res, statusCode, { error: message });
}

/**
 * Handles auth-related HTTP routes. Returns true if the route was handled,
 * false if the URL did not match any auth route.
 */
export async function handleAuthRoute(
    req: IncomingMessage,
    res: ServerResponse,
    db: DatabaseSync,
    config: AuthConfig,
    rateLimiter: RateLimiter,
    challenges: ChallengeStore,
): Promise<boolean> {
    const url = req.url;
    if (!url || !url.startsWith("/auth/")) {
        return false;
    }

    if (req.method !== "POST") {
        sendError(res, 405, "Method Not Allowed");
        return true;
    }

    // Rate limiting
    if (!rateLimiter.check(getClientIp(req))) {
        sendError(res, 429, "Too Many Requests");
        return true;
    }

    // Origin check
    if (!checkOrigin(req)) {
        sendError(res, 403, "Forbidden");
        return true;
    }

    try {
        switch (url) {
            case "/auth/register/begin":
                return await handleRegisterBegin(
                    req,
                    res,
                    db,
                    config,
                    challenges,
                );
            case "/auth/register/complete":
                return await handleRegisterComplete(
                    req,
                    res,
                    db,
                    config,
                    challenges,
                );
            case "/auth/login/begin":
                return await handleLoginBegin(req, res, db, config, challenges);
            case "/auth/login/complete":
                return await handleLoginComplete(
                    req,
                    res,
                    db,
                    config,
                    challenges,
                );
            case "/auth/logout":
                return await handleLogout(req, res, db, config);
            default:
                sendError(res, 404, "Not Found");
                return true;
        }
    } catch (err) {
        if (err instanceof BodyTooLargeError) {
            sendError(res, 413, "Request body too large");
            return true;
        }
        if (err instanceof InvalidJsonError) {
            sendError(res, 400, "Invalid JSON");
            return true;
        }
        log.error("Auth route error", { error: err });
        sendError(res, 500, "Internal Server Error");
        return true;
    }
}

async function handleRegisterBegin(
    req: IncomingMessage,
    res: ServerResponse,
    db: DatabaseSync,
    config: AuthConfig,
    challenges: ChallengeStore,
): Promise<true> {
    const body = await parseJsonBody<{ playerId: string }>(req, MAX_BODY_BYTES);

    if (!isValidPlayerId(body.playerId)) {
        sendError(
            res,
            400,
            "playerId is required and must be at most 64 bytes",
        );
        return true;
    }

    const options = generateRegistrationOptions(
        db,
        body.playerId,
        config,
        challenges,
    );
    sendJson(res, 200, options);
    return true;
}

async function handleRegisterComplete(
    req: IncomingMessage,
    res: ServerResponse,
    db: DatabaseSync,
    config: AuthConfig,
    challenges: ChallengeStore,
): Promise<true> {
    const body = await parseJsonBody<{
        playerId: string;
        response: RegistrationResponse;
    }>(req, MAX_BODY_BYTES);

    if (!isValidPlayerId(body.playerId) || !body.response) {
        sendError(res, 400, "playerId and response are required");
        return true;
    }

    const verified = verifyRegistration(
        db,
        body.playerId,
        body.response,
        config,
        challenges,
    );

    if (!verified) {
        sendError(res, 400, "Registration verification failed");
        return true;
    }

    // Create session on successful registration
    const session = createSession(db, body.playerId, config.sessionDurationMs);
    const secure = config.expectedOrigin.startsWith("https://");
    res.setHeader(
        "Set-Cookie",
        buildSessionCookieHeader(session.sessionId, secure),
    );
    sendJson(res, 200, { verified: true });
    return true;
}

async function handleLoginBegin(
    req: IncomingMessage,
    res: ServerResponse,
    db: DatabaseSync,
    config: AuthConfig,
    challenges: ChallengeStore,
): Promise<true> {
    const body = await parseJsonBody<{ playerId: string }>(req, MAX_BODY_BYTES);

    if (!isValidPlayerId(body.playerId)) {
        sendError(
            res,
            400,
            "playerId is required and must be at most 64 bytes",
        );
        return true;
    }

    const options = generateAuthenticationOptions(
        db,
        body.playerId,
        config,
        challenges,
    );
    sendJson(res, 200, options);
    return true;
}

async function handleLoginComplete(
    req: IncomingMessage,
    res: ServerResponse,
    db: DatabaseSync,
    config: AuthConfig,
    challenges: ChallengeStore,
): Promise<true> {
    const body = await parseJsonBody<{
        playerId: string;
        response: AuthenticationResponse;
    }>(req, MAX_BODY_BYTES);

    if (!isValidPlayerId(body.playerId) || !body.response) {
        sendError(res, 400, "playerId and response are required");
        return true;
    }

    const verified = verifyAuthentication(
        db,
        body.playerId,
        body.response,
        config,
        challenges,
    );

    if (!verified) {
        sendError(res, 401, "Authentication failed");
        return true;
    }

    const session = createSession(db, body.playerId, config.sessionDurationMs);
    const secure = config.expectedOrigin.startsWith("https://");
    res.setHeader(
        "Set-Cookie",
        buildSessionCookieHeader(session.sessionId, secure),
    );
    sendJson(res, 200, { verified: true });
    return true;
}

async function handleLogout(
    req: IncomingMessage,
    res: ServerResponse,
    db: DatabaseSync,
    config: AuthConfig,
): Promise<true> {
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        if (cookies["session"]) {
            deleteSession(db, cookies["session"]);
        }
    }

    const secure = config.expectedOrigin.startsWith("https://");
    res.setHeader("Set-Cookie", buildSessionCookieHeader("", secure, true));
    sendJson(res, 200, { loggedOut: true });
    return true;
}

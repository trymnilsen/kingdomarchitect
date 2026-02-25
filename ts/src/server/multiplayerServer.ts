import * as http from "node:http";
import { DatabaseSync } from "node:sqlite";
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import { GameServer } from "./gameServer.ts";
import { SQLiteAdapter } from "./persistence/sqliteAdapter.ts";
import { gameMigrations, authMigrations } from "./persistence/migration.ts";
import { applySQLiteMigrations } from "./persistence/sqliteMigrationCompiler.ts";
import { ConnectionManager } from "./connectionManager.ts";
import { createMultiplayerMessageRouter } from "./multiplayerMessageRouter.ts";
import { handleAuthRoute, type AuthConfig } from "./auth/routes.ts";
import { ChallengeStore } from "./auth/passkey.ts";
import { validateSession, parseCookies } from "./auth/session.ts";
import { createRateLimiter } from "./http/rateLimit.ts";
import { serveStaticFile } from "./http/staticFiles.ts";
import type { GameMessage } from "./message/gameMessage.ts";

export type MultiplayerServerConfig = {
    port: number;
    dbPath: string;
    staticDirectory: string;
    devAuth: boolean;
    auth: AuthConfig;
};

export function readConfig(): MultiplayerServerConfig {
    const port = parseInt(process.env["PORT"] ?? "3000", 10);
    const dbPath = process.env["DB_PATH"] ?? "./kingdom.db";
    const staticDirectory = process.env["SERVE_DIR"] ?? "./public";
    const devAuth = process.env["DEV_AUTH"] === "true";
    const rpId = process.env["RP_ID"] ?? "localhost";
    const rpName = process.env["RP_NAME"] ?? "Kingdom Architect";
    const expectedOrigin =
        process.env["EXPECTED_ORIGIN"] ?? `http://localhost:${port}`;

    return {
        port,
        dbPath,
        staticDirectory,
        devAuth,
        auth: {
            rpName,
            rpId,
            expectedOrigin,
            sessionDurationMs: 7 * 24 * 60 * 60 * 1000, // 1 week
        },
    };
}

export function startMultiplayerServer(
    config: MultiplayerServerConfig,
): http.Server {
    // Initialize SQLite with all migrations
    const db = new DatabaseSync(config.dbPath);
    db.exec("PRAGMA journal_mode=WAL");
    db.exec("PRAGMA synchronous=NORMAL");
    applySQLiteMigrations(db, [...gameMigrations, ...authMigrations]);

    // Create persistence adapter
    const adapter = new SQLiteAdapter(db);

    // Create connection manager, message router, and rate limiter
    const connectionManager = new ConnectionManager();
    const messageRouter = createMultiplayerMessageRouter(connectionManager);
    const authRateLimiter = createRateLimiter(60_000, 20);
    const challengeStore = new ChallengeStore();

    // Create and init game server (no initial player — players join via WebSocket)
    const gameServer = new GameServer(messageRouter, adapter);
    let gameServerReady = false;
    gameServer
        .init()
        .then(() => {
            gameServerReady = true;
            console.log("Game server initialized");
        })
        .catch((err) => {
            console.error("Failed to initialize game server:", err);
            process.exit(1);
        });

    // Create HTTP server
    const server = http.createServer(async (req, res) => {
        try {
            // Auth routes
            if (
                await handleAuthRoute(
                    req,
                    res,
                    db,
                    config.auth,
                    authRateLimiter,
                    challengeStore,
                )
            ) {
                return;
            }

            // Static files
            if (await serveStaticFile(req, res, config.staticDirectory)) {
                return;
            }

            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found");
        } catch (err) {
            console.error("HTTP request error:", err);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal Server Error");
        }
    });

    // WebSocket upgrade
    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (req, socket, head) => {
        if (!gameServerReady) {
            socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
            socket.destroy();
            return;
        }

        let playerId: string | null = null;

        // DEV_AUTH mode: accept ?player=name query param directly
        if (config.devAuth) {
            try {
                const url = new URL(req.url!, `http://${req.headers.host}`);
                const playerParam = url.searchParams.get("player");
                if (playerParam) {
                    playerId = playerParam;
                }
            } catch {
                // ignore parse errors
            }
        }

        // Normal auth: validate session cookie
        if (!playerId) {
            const cookieHeader = req.headers.cookie;
            if (cookieHeader) {
                const cookies = parseCookies(cookieHeader);
                if (cookies["session"]) {
                    const session = validateSession(db, cookies["session"]);
                    if (session) {
                        playerId = session.playerId;
                    }
                }
            }
        }

        if (!playerId) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }

        const authenticatedPlayerId = playerId;

        wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
            connectionManager.addConnection(authenticatedPlayerId, ws);
            console.log(`Player connected: ${authenticatedPlayerId}`);

            gameServer.handlePlayerConnected(authenticatedPlayerId);

            ws.on("message", (data) => {
                try {
                    const message = JSON.parse(data.toString()) as GameMessage;
                    gameServer.onMessage(message, authenticatedPlayerId);
                } catch (err) {
                    console.error(
                        `Invalid message from ${authenticatedPlayerId}:`,
                        err,
                    );
                }
            });

            ws.on("close", () => {
                console.log(`Player disconnected: ${authenticatedPlayerId}`);
            });
        });
    });

    server.listen(config.port, "0.0.0.0", () => {
        console.log(`Multiplayer server running on port ${config.port}`);
        if (config.devAuth) {
            console.log(
                "DEV_AUTH enabled — connect with ?player=name to skip authentication",
            );
        }
    });

    // Graceful shutdown
    const shutdown = async () => {
        console.log("Shutting down...");
        try {
            await gameServer.saveGame();
            console.log("Game saved");
        } catch (err) {
            console.error("Failed to save game during shutdown:", err);
        }

        // Close all WebSocket connections
        for (const playerId of connectionManager.getConnectedPlayerIds()) {
            connectionManager.removeConnection(playerId);
        }

        server.close(() => {
            db.close();
            console.log("Server shut down");
            process.exit(0);
        });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    return server;
}

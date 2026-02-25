import type { GameMessage } from "./message/gameMessage.ts";

/**
 * Abstracts how game messages are delivered to connected clients.
 * In singleplayer, both methods go to the same webworker parent.
 * In multiplayer, broadcast sends to all WebSockets and sendTo
 * targets a specific player.
 */
export interface MessageRouter {
    broadcast(message: GameMessage): void;
    sendTo(playerId: string, message: GameMessage): void;
}

import type { ConnectionManager } from "./connectionManager.ts";
import type { MessageRouter } from "./messageRouter.ts";

/**
 * Adapts a ConnectionManager to the MessageRouter interface
 * used by GameServer.
 */
export function createMultiplayerMessageRouter(
    connections: ConnectionManager,
): MessageRouter {
    return {
        broadcast: (message) => connections.broadcast(message),
        sendTo: (playerId, message) => connections.sendTo(playerId, message),
    };
}

import type { GameMessage } from "./message/gameMessage.ts";
import type { MessageRouter } from "./messageRouter.ts";

/**
 * Routes all messages to a single callback. Used for the webworker
 * singleplayer path where both broadcast and sendTo go to the same
 * postMessage target.
 */
export function createSinglePlayerMessageRouter(
    postMessage: (message: GameMessage) => void,
): MessageRouter {
    return {
        broadcast: postMessage,
        sendTo: (_playerId, message) => postMessage(message),
    };
}

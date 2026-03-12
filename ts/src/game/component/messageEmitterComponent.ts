import type { GameMessage } from "../../server/message/gameMessage.ts";

export type MessageEmitterComponent = {
    id: typeof MessageEmitterComponentId;
    emitter: (message: GameMessage) => void;
};

export const MessageEmitterComponentId = "MessageEmitter";

export function createMessageEmitterComponent(
    emitter: (message: GameMessage) => void,
): MessageEmitterComponent {
    return {
        id: MessageEmitterComponentId,
        emitter,
    };
}

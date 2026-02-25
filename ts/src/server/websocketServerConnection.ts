import type { GameCommand } from "./message/gameCommand.ts";
import { Event } from "../common/event.ts";
import { GameServerConnection } from "./gameServerConnection.ts";
import type { CommandGameMessage, GameMessage } from "./message/gameMessage.ts";

/**
 * Client-side WebSocket connection to a multiplayer server.
 * Implements the same GameServerConnection interface as
 * WebworkerServerConnection, using the browser-native WebSocket API.
 */
export class WebSocketServerConnection implements GameServerConnection {
    private socket: WebSocket;
    private _onMessageEvent: Event<GameMessage>;
    private url: string;
    private reconnectTimer?: ReturnType<typeof setTimeout>;

    public get onMessage(): Event<GameMessage> {
        return this._onMessageEvent;
    }

    constructor(url: string) {
        this.url = url;
        this._onMessageEvent = new Event();
        this.socket = this.connect();
    }

    postCommand(command: GameCommand): void {
        const message: CommandGameMessage = {
            type: "command",
            command: command,
        };

        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.warn("WebSocket not open, command dropped");
        }
    }

    private connect(): WebSocket {
        const socket = new WebSocket(this.url);

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data) as GameMessage;
                this._onMessageEvent.publish(message);
            } catch (err) {
                console.error("Failed to parse server message:", err);
            }
        };

        socket.onclose = () => {
            console.log("WebSocket closed, attempting reconnect...");
            this.scheduleReconnect();
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return socket;
    }

    // TODO: Replace fixed 3s delay with exponential backoff (1s, 2s, 4s...
    // capped at 30s) and a max retry count to avoid hammering a downed server.
    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            return;
        }
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined;
            console.log("Reconnecting...");
            this.socket = this.connect();
        }, 3000);
    }
}

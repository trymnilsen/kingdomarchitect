import type { WebSocket } from "ws";
import type { GameMessage } from "./message/gameMessage.ts";

/**
 * Manages the mapping of player IDs to WebSocket connections.
 * Attaches close/error handlers on each socket to auto-remove
 * disconnected players.
 */
export class ConnectionManager {
    private connections = new Map<string, WebSocket>();

    addConnection(playerId: string, socket: WebSocket): void {
        // If there's an existing connection for this player, close it
        const existing = this.connections.get(playerId);
        if (existing) {
            existing.close();
        }

        this.connections.set(playerId, socket);

        const cleanup = () => {
            // Only remove if this socket is still the active one
            if (this.connections.get(playerId) === socket) {
                this.connections.delete(playerId);
            }
        };

        socket.on("close", cleanup);
        socket.on("error", cleanup);
    }

    removeConnection(playerId: string): void {
        const socket = this.connections.get(playerId);
        if (socket) {
            this.connections.delete(playerId);
            if (
                socket.readyState === socket.OPEN ||
                socket.readyState === socket.CONNECTING
            ) {
                socket.close();
            }
        }
    }

    getConnection(playerId: string): WebSocket | null {
        return this.connections.get(playerId) ?? null;
    }

    getConnectedPlayerIds(): string[] {
        return Array.from(this.connections.keys());
    }

    broadcast(message: GameMessage): void {
        const json = JSON.stringify(message);
        for (const socket of this.connections.values()) {
            if (socket.readyState === socket.OPEN) {
                socket.send(json);
            }
        }
    }

    sendTo(playerId: string, message: GameMessage): void {
        const socket = this.connections.get(playerId);
        if (socket) {
            this.sendMessage(socket, message);
        }
    }

    private sendMessage(socket: WebSocket, message: GameMessage): void {
        if (socket.readyState === socket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    }
}

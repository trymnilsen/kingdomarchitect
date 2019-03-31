import { getLog, Logger } from "./monitoring/logger";
import {
    NetworkEvent,
    AuthenticateMessageId
} from "../common/data/event/networkEvent";

export type WebSocket = import("ws");

export class GameServer {
    private connectionId = 0;
    private logger: Logger;
    private unauthenticatedConnections: { [id: string]: WebSocket } = {};
    private authenticatedConnections: { [id: string]: WebSocket } = {};

    public constructor() {
        this.logger = getLog("GameServer");
    }

    public clientConnected(ws: WebSocket): void {
        const newClientId = this.connectionId + 1;
        this.connectionId = newClientId;
        this.unauthenticatedConnections[newClientId] = ws;
        ws.on("message", (data) => {
            this.logger.info(
                `OnMessage connection: ${newClientId} data: ${data.toString()}`
            );
            this.onMessage(data.toString(), newClientId);
        });
    }

    private onMessage = (data: string, connectionId: number) => {
        const parsedData: NetworkEvent = JSON.parse(data);
        const socket = this.unauthenticatedConnections[connectionId];
        if (parsedData.id === AuthenticateMessageId) {
            // Todo check authenticity
            if (!!parsedData.data.id) {
                const responseMessage: NetworkEvent = {
                    id: AuthenticateMessageId,
                    status: "OK",
                    data: {}
                };
                socket.send(JSON.stringify(responseMessage));
                this.authenticatedConnections[connectionId] = socket;
                delete this.unauthenticatedConnections[connectionId];
            } else {
                const responseMessage: NetworkEvent = {
                    id: AuthenticateMessageId,
                    status: "REFUSE",
                    data: {}
                };
                socket.send(JSON.stringify(responseMessage));
                socket.close();
                delete this.unauthenticatedConnections[connectionId];
            }
        }
    };
}

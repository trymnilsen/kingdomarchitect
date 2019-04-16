import {
    AuthenticateMessageId,
    AuthenticateMessageIdType,
    ChannelMessage,
    NetworkEvent
} from "../common/data/event/networkEvent";
import { User } from "../common/data/user";
import { action } from "../common/simulation/action";
import { getLog, Logger } from "./monitoring/logger";
import { Simulation } from "../common/simulation/simulation";
import { JsonTree } from "../common/jsontree/jsonNode";
import {
    NodeOperation,
    applyOperations,
    OperationMode
} from "../common/jsontree/nodeOperations";

export type WebSocket = import("ws");

export class GameServer {
    private connectionId = 0;
    private logger: Logger;
    private simulation: Simulation;
    private state: JsonTree;
    private unauthenticatedConnections: { [id: string]: WebSocket } = {};
    private authenticatedConnections: { [id: string]: WebSocket } = {};

    public constructor() {
        this.logger = getLog("GameServer");
        this.simulation = new Simulation(this.state);
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
        switch (parsedData.id) {
            case "AUTH":
                this.handleAuthentication(parsedData, socket, connectionId);
                break;
            case "CHANNELMESSAGE":
                this.handleChannelMessage(parsedData, socket, connectionId);
                break;
            default:
                break;
        }
        // Todo check authenticity
    };

    private handleChannelMessage(
        parsedData: ChannelMessage,
        socket: WebSocket,
        connectionId: number
    ) {
        if (!!parsedData.data) {
            const channelData = parsedData.data;
            const gameEvent = channelData.data;
            switch (gameEvent.id) {
                case "action":
                    console.log("Game Event - Action", gameEvent.data);
                    const ops = this.simulation.dispatchAction(gameEvent.data);
                    applyOperations(ops, this.state);
                    this.broadcastOperations(ops, connectionId);
                default:
                    console.warn("Game Event - invalid id", gameEvent);
                    break;
            }
        }
    }
    private broadcastOperations(
        operations: NodeOperation[],
        broadcasterConnectionId?: number
    ) {
        const containsSync = operations.some(
            (x) => x.mode === OperationMode.sync
        );
        const excludedIds = [];
        if (!containsSync) {
            excludedIds.push(broadcasterConnectionId);
        }
        this.broadcastNetworkEvent(
            {
                id: "CHANNELMESSAGE"
            },
            excludedIds
        );
    }
    private broadcastNetworkEvent(
        event: NetworkEvent,
        excludedConnectionIds: number[]
    ) {}
    private handleAuthentication(
        parsedData: AuthenticateMessageIdType,
        socket: WebSocket,
        connectionId: number
    ): void {
        const validAuth = this.validateAuthentication(
            parsedData,
            socket,
            connectionId
        );
        if (validAuth) {
            const user: User = {
                id: "foo"
            };
        }
    }
    private validateAuthentication(
        parsedData: AuthenticateMessageIdType,
        socket: WebSocket,
        connectionId: number
    ): boolean {
        if (!!parsedData.data) {
            const responseMessage: NetworkEvent = {
                id: AuthenticateMessageId,
                status: "OK"
            };
            socket.send(JSON.stringify(responseMessage));
            this.authenticatedConnections[connectionId] = socket;
            delete this.unauthenticatedConnections[connectionId];
            return true;
        } else {
            const responseMessage: NetworkEvent = {
                id: AuthenticateMessageId,
                status: "REFUSE"
            };
            socket.send(JSON.stringify(responseMessage));
            socket.close();
            delete this.unauthenticatedConnections[connectionId];
            return false;
        }
    }
}

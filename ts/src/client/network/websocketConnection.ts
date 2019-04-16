import {
    AuthenticateMessageId,
    ChannelMessageData,
    NetworkEvent
} from "../../common/data/event/networkEvent";
import { Service } from "../../common/ioc/service";
import { getUser } from "../data/user";
import {
    EventSubscriptionHandler,
    EventHandle,
    Event,
    EventListener
} from "../../common/event/event";

export class WebsocketConnection implements Service {
    public static readonly ServiceName = "websocket";
    private connection: WebSocket;
    private channels: { [id: string]: WebsocketChannel<any> };
    public constructor() {
        this.channels = {};
    }

    public async connect() {
        this.connection = new WebSocket("ws://localhost:5000/ws");
        this.connection.addEventListener("message", this.onMessage);
        this.connection.addEventListener("error", (err) => {
            console.error("WS: error ", err);
        });
        return new Promise<void>((resolve, reject) => {
            this.connection.onopen = (event) => {
                const networkEvent: NetworkEvent = {
                    id: AuthenticateMessageId,
                    data: getUser()
                };
                this.connection.send(JSON.stringify(networkEvent));
                resolve();
            };
        });
    }
    public getChannel<T>(name: string): SocketChannel<T> {
        let channel = this.channels[name];
        if (!channel) {
            channel = new WebsocketChannel<T>();
            this.channels[name] = channel;
        }
        return channel as SocketChannel<T>;
    }
    public get name(): string {
        return WebsocketConnection.ServiceName;
    }
    private routeChannelMessage(channelData: ChannelMessageData) {
        const channel = this.channels[channelData.channel];
        if (!!channel) {
            channel.publishMessage(channelData.data);
        }
    }
    private onMessage = (message: MessageEvent) => {
        const messageData: string = message.data;
        let networkEvent: NetworkEvent = null;
        try {
            networkEvent = JSON.parse(messageData);
        } catch (err) {
            console.error(
                "Failed to parse websocket message",
                err,
                messageData
            );
        }
        switch (networkEvent.id) {
            case "AUTH":
                console.log("Received auth", networkEvent.data);
                break;
            case "CHANNELMESSAGE":
                this.routeChannelMessage(networkEvent.data);
                break;
            default:
                console.warn(
                    "network event id not implemented",
                    networkEvent.id
                );
                break;
        }
    };
}

export class WebsocketChannel<T> implements SocketChannel<T> {
    private onEventReceived: Event<T>;
    public constructor() {
        this.onEventReceived = new Event();
    }
    public listen(subscriber: EventSubscriptionHandler<T>): EventHandle {
        return null;
    }
    public send(item: T): void {}
    public publishMessage(data: T) {
        this.onEventReceived.publish(data);
    }
}

export interface SocketChannel<T> extends EventListener<T> {
    send(item: T): void;
}

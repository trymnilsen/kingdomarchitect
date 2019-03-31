import { getUser } from "../data/user";
import { NetworkEvent, AuthenticateMessageId } from "../../common/data/event/networkEvent";

export class WebsocketConnection {
    private connection: WebSocket;
    public constructor() {

    }
    public async connect() {
        this.connection = new WebSocket("ws://localhost:5000/ws");
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
}


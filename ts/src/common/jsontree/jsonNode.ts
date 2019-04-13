import {
    EventListener,
    Event,
    EventSubscriptionHandler,
    EventHandle
} from "../event/event";

export enum JsonNodeType {
    Container,
    Field
}
export enum ChangeOperation {
    Removed,
    Replaced,
    Pushed
}

export interface JsonNodeChangeEvent {
    node: JsonNode;
    operation: ChangeOperation;
    cancelBubbling?: boolean;
}

export abstract class JsonNode {
    private id: string;
    private children: { [id: string]: JsonNode };
    private type: JsonNodeType;
    private parent: JsonNode;
    private changeEvent: Event<JsonNodeChangeEvent>;
    public constructor(parent: JsonNode, type: JsonNodeType) {
        this.type = type;
        this.changeEvent = new Event<JsonNodeChangeEvent>();
    }
    public abstract toData(): any;
    public get(path: string): JsonNode {}
    public put(data: {}) {}
    public push(data: {}) {}
    public listen(
        listener: EventSubscriptionHandler<JsonNodeChangeEvent>
    ): EventHandle {
        return this.changeEvent.listen(listener);
    }
    public removeChild(id: string): boolean {
        const deletedElement = this.children[id];
        if (!!deletedElement) {
            delete this.children[id];
            deletedElement.dispatchEvent({
                node: deletedElement,
                operation: ChangeOperation.Removed
            });
        } else {
            console.warn(`Cannot delete ${id} not found in children`);
            return false;
        }
    }
    public remove() {}
    public dispatchEvent(event: JsonNodeChangeEvent) {
        this.changeEvent.publish(event);
        if (!event.cancelBubbling) {
            this.parent.dispatchEvent(event);
        }
    }

    public get path(): string {
        return this.id + this.parent.path;
    }
}

export class JsonNodeContainer extends JsonNode {
    public constructor(parent: JsonNode) {
        super(parent, JsonNodeType.Container);
    }
    public toData(): any {}
}

export function getId(): string {
    let text = "";
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 8; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    const id = Date.now() + text;
    return id;
}

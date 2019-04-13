import {
    EventListener,
    Event,
    EventSubscriptionHandler,
    EventHandle
} from "../event/event";
import { Json, JsonValueTypes, JsonArray } from "../json";

export enum JsonNodeType {
    Container,
    String,
    Boolean,
    Number
}
export enum ChangeOperation {
    Removed,
    Pushed
}

export interface JsonNodeChangeEvent {
    node: JsonNode;
    operation: ChangeOperation;
    cancelBubbling?: boolean;
}

export type JsonObject = {
    [id: string]: object | number | string | Array<object | number | string>;
};

export abstract class JsonNode {
    private _id: string;
    private children: { [id: string]: JsonNode };
    private _type: JsonNodeType;
    private parent: JsonNode;
    private changeEvent: Event<JsonNodeChangeEvent>;
    public constructor(parent: JsonNode, type: JsonNodeType, id?: string) {
        this.children = {};
        this._type = type;
        this._id = id;
        this.changeEvent = new Event<JsonNodeChangeEvent>();
    }
    public abstract toData(): any;
    public get(id: string | string[]): JsonNode {
        if (!id) {
            console.warn(
                "Trying to get node with undefined id, returning null"
            );
            return null;
        }
        //If array is provided recurse into children
        if (Array.isArray(id)) {
            //If the array is larger than one fetch the children with
            //id of first element and then pass the rest to the child
            if (id.length > 1) {
                const firstChild = this.children[id[0]];
                if (!!firstChild) {
                    const newIdPath = id.splice(0, 1);
                    return firstChild.get(newIdPath);
                } else {
                    return null;
                }
            } else if (id.length === 1) {
                //if only one element is present in array treat it as the id
                return this.get(id[0]);
            } else {
                return null;
            }
        } else {
            const child = this.children[id];
            return child;
        }
    }
    public put(data: JsonValueTypes, id: string) {
        const existingElement = this.children[id];
        if (!!existingElement) {
            existingElement.remove();
        }
        const dataAsJsonNode = dataToJsonNode(this, data);
        this.children[id] = dataAsJsonNode;
        this.dispatchEvent({
            node: dataAsJsonNode,
            operation: ChangeOperation.Pushed
        });
        return dataAsJsonNode;
    }
    public push(data: JsonValueTypes): JsonNode {
        const dataAsJsonNode = dataToJsonNode(this, data);
        this.children[dataAsJsonNode.id] = dataAsJsonNode;
        this.dispatchEvent({
            node: dataAsJsonNode,
            operation: ChangeOperation.Pushed
        });
        return dataAsJsonNode;
    }
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
            deletedElement.dispose();
            return true;
        } else {
            console.warn(`Cannot delete ${id} not found in children`);
            return false;
        }
    }
    public remove() {
        if (!this.parent) {
            throw new Error("Cannot remove root node");
        }
        this.parent.removeChild(this._id);
    }
    public dispose() {
        this.changeEvent.dispose();
        Object.values(this.children).forEach((child) => child.dispose());
    }
    public dispatchEvent(event: JsonNodeChangeEvent) {
        this.changeEvent.publish(event);
        if (!event.cancelBubbling) {
            if (!!this.parent) {
                this.parent.dispatchEvent(event);
            }
        }
    }

    public get id(): string {
        return this._id;
    }
    public get path(): string {
        return this._id + (!!this.parent ? this.parent.path : "");
    }
    public get size(): number {
        return Object.values(this.children).length;
    }
    public get type(): JsonNodeType {
        return this._type;
    }
}

export class JsonNodeContainer extends JsonNode {
    public constructor(parent: JsonNode) {
        super(parent, JsonNodeType.Container);
    }
    public toData(): any { }
}
export class JsonNodeField<T> extends JsonNode {
    private value: T;
    public constructor(parent: JsonNode, type: JsonNodeType, value: T) {
        super(parent, type, getId());
        this.value = value;
    }
    public toData(): any { }
}

const firstOfJan2019 = 1546304400000;

export function getId(): string {
    let text = "";
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 8; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    const id = "k" + (Date.now() - firstOfJan2019) + text;
    return id;
}

function dataToJsonNode(parent: JsonNode, data: JsonValueTypes): JsonNode {
    const dataType = typeof data;
    switch (dataType) {
        case "boolean":
            return new JsonNodeField<boolean>(parent, JsonNodeType.Boolean, data as boolean);
            break;
        case "number":
            return new JsonNodeField<number>(parent, JsonNodeType.Number, data as number);
            break;
        case "string":
            return new JsonNodeField<string>(parent, JsonNodeType.String, data as string);
            break;
        case "object":
            return dataObjectToJsonNode(parent, data as Json | JsonArray);
            break;
        default:
            throw new Error("Invalid datatype " + dataType);
    }
}
function dataObjectToJsonNode(parent: JsonNode, data: Json | JsonArray): JsonNode {
    const container = new JsonNodeContainer(parent);
    if (Array.isArray(data)) {
        data.forEach((item) => { container.push(item); });
    } else {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const element = data[key];
                container.push(element);
            }
        }
    }
    return container;
}

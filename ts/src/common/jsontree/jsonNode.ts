import {
    EventListener,
    Event,
    EventSubscriptionHandler,
    EventHandle
} from "../event/event";
import { JsonObject, Json, JsonArray } from "../json";
import { isBlank } from "../string";

const firstOfJan2019 = 1546304400000;

export type NodeValueType = string | boolean | number;

export enum JsonNodeType {
    Container,
    String,
    Boolean,
    Number
}
export enum ChangeOperation {
    Removed,
    Added
}

export interface JsonNodeChangeEvent {
    node: JsonNode;
    operation: ChangeOperation;
    cancelBubbling?: boolean;
    trigger?: string;
}

export type JsonObject = {
    [id: string]: object | number | string | Array<object | number | string>;
};

export abstract class JsonNode implements EventListener<JsonNodeChangeEvent> {
    private _id: string;
    private _type: JsonNodeType;
    private parent: JsonNode;
    private changeEvent: Event<JsonNodeChangeEvent>;
    protected _children: { [id: string]: JsonNode };
    public constructor(parent: JsonNode, type: JsonNodeType, id?: string) {
        this._children = {};
        this._id = id || getId();
        this._type = type;
        this.parent = parent;
        this.changeEvent = new Event<JsonNodeChangeEvent>();
    }
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
                const firstChild = this._children[id[0]];
                if (!!firstChild) {
                    id.splice(0, 1);
                    return firstChild.get(id);
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
            const child = this._children[id];
            return child;
        }
    }
    public getValue<T extends NodeValueType>(id: string | string[]): T {
        const node = this.get(id);
        if (!!node) {
            return getNodeValue<T>(node);
        } else {
            return null;
        }
    }
    public put(data: Json, id: string) {
        if (isBlank(id)) {
            throw new Error("Cannot put to empty id");
        }
        const existingElement = this._children[id];
        if (!!existingElement) {
            existingElement.remove();
        }
        const dataAsJsonNode = dataToJsonNode(this, data);
        dataAsJsonNode.id = id;
        this._children[id] = dataAsJsonNode;
        this.dispatchEvent({
            node: dataAsJsonNode,
            operation: ChangeOperation.Added
        });
        return dataAsJsonNode;
    }
    public replace(data: JsonObject) {
        //Create json node from data
        const dataAsJsonNode = dataToJsonNode(this.parent, data);
        //Remove each node so we can dispose them and send events
        this.getChildrenAsArray().forEach((x) => x.remove());
        //set the children of the create data node to this
        this.children = dataAsJsonNode.children;
        this.dispatchEvent({
            node: this,
            operation: ChangeOperation.Added
        });
    }
    public push(data: Json): JsonNode {
        const dataAsJsonNode = dataToJsonNode(this, data);
        this._children[dataAsJsonNode.id] = dataAsJsonNode;
        this.dispatchEvent({
            node: dataAsJsonNode,
            operation: ChangeOperation.Added
        });
        return dataAsJsonNode;
    }
    public listen(
        listener: EventSubscriptionHandler<JsonNodeChangeEvent>
    ): EventHandle {
        return this.changeEvent.listen(listener);
    }
    public removeChild(id: string): boolean {
        const deletedElement = this._children[id];
        if (!!deletedElement) {
            delete this._children[id];
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
        Object.values(this._children).forEach((child) => child.dispose());
    }
    public dispatchEvent(event: JsonNodeChangeEvent) {
        this.changeEvent.publish(event);
        if (!event.cancelBubbling) {
            if (!!this.parent) {
                this.parent.dispatchEvent(event);
            }
        }
    }

    public getChildrenAsArray(): ReadonlyArray<JsonNode> {
        return Object.values(this._children);
    }
    public abstract toData(): Json;

    public get id(): string {
        return this._id;
    }
    public set id(id: string) {
        this._id = id;
    }
    public get children(): { [id: string]: JsonNode } {
        return this._children;
    }
    public set children(children: { [id: string]: JsonNode }) {
        this._children = children;
    }
    public get path(): string[] {
        return (!!this.parent ? this.parent.path : []).concat([this.id]);
    }
    public get size(): number {
        return Object.values(this._children).length;
    }
    public get type(): JsonNodeType {
        return this._type;
    }
}

export class JsonNodeContainer extends JsonNode {
    public constructor(parent: JsonNode) {
        super(parent, JsonNodeType.Container);
    }

    public toData(): Json {
        const result: JsonObject = {};
        for (const key in this._children) {
            if (this._children.hasOwnProperty(key)) {
                const element = this._children[key];
                result[element.id] = element.toData();
            }
        }
        return result;
    }
}
export class JsonTree extends JsonNodeContainer {
    public static readonly RootNodeId = "root";
    public constructor() {
        super(null);
        this.id = JsonTree.RootNodeId;
    }
}
export class JsonNodeField<T extends NodeValueType> extends JsonNode {
    private _value: T;
    public constructor(parent: JsonNode, type: JsonNodeType, value: T) {
        super(parent, type);
        this._value = value;
    }
    public get value(): Readonly<T> {
        return this._value;
    }
    public toData(): Json {
        return this._value;
    }
}

const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export function getId(): string {
    let text = "";

    for (let i = 0; i < 12; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    const id = "k" + (Date.now() - firstOfJan2019) + text;
    return id;
}

export function getNodeValue<T extends NodeValueType>(node: JsonNode): T {
    if (!node) {
        return null;
    }
    if (node.type === JsonNodeType.Container) {
        return null;
    }
    const nodeAsField = node as JsonNodeField<T>;
    return nodeAsField.value;
}

function getIdToString(id: string | string[]): string {
    if (Array.isArray(id)) {
        return `['${id.join("','")}']`;
    } else {
        return id;
    }
}

function dataToJsonNode(parent: JsonNode, data: Json): JsonNode {
    const dataType = typeof data;
    switch (dataType) {
        case "boolean":
            return new JsonNodeField<boolean>(
                parent,
                JsonNodeType.Boolean,
                data as boolean
            );
            break;
        case "number":
            return new JsonNodeField<number>(
                parent,
                JsonNodeType.Number,
                data as number
            );
            break;
        case "string":
            return new JsonNodeField<string>(
                parent,
                JsonNodeType.String,
                data as string
            );
            break;
        case "object":
            return dataObjectToJsonNode(parent, data as JsonObject | JsonArray);
            break;
        default:
            throw new Error("Invalid datatype " + dataType);
    }
}
function dataObjectToJsonNode(
    parent: JsonNode,
    data: JsonObject | JsonArray
): JsonNode {
    const container = new JsonNodeContainer(parent);
    if (Array.isArray(data)) {
        data.forEach((item) => {
            container.push(item);
        });
    } else {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const element = data[key];
                container.put(element, key);
            }
        }
    }
    return container;
}

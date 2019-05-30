import { Json } from "../util/json";
import {
    EventListener,
    EventHandle,
    EventSubscriptionHandler
} from "../event/event";

/* export type DataNode = DataStorageNodeContainer | DataStorageNodeField;

export interface TreeNodeData {
    type: "field" | "container";
    parent: DataNode;
    id: string;
    tree?: DataTree;
}
export interface DataStorageNodeField extends TreeNodeData {
    type: "field";
    data: string | number | boolean;
}
export interface DataStorageNodeContainer extends TreeNodeData {
    type: "container";
    children: { [key: string]: DataNode };
} */

export type DataNodePath = string | string[];

export enum ChangeOperation {
    Add,
    Set,
    Remove
}
export interface NodeChangeEvent {
    data: Json;
    operation: ChangeOperation;
    path: string[];
}

export interface DataNodeOperations {
    get(id: DataNodePath): DataNodeReference;
    set(data: Json): DataNodeReference;
    push(data: Json): DataNodeReference;
    remove(): void;
}

export interface DataNodeReference extends DataNodeOperations {
    path: string[];
    value: <T extends Json>() => T;
    listen: (event: EventSubscriptionHandler<NodeChangeEvent>) => EventHandle;
}

export type EventListenersCollection = {
    [path: string]: {
        [eventHandle: string]: EventSubscriptionHandler<NodeChangeEvent>;
    };
};

export type DataNode = {} | string | boolean | number;

export class DataTree {
    private readonly rootNode: {};
    private listeners: EventListenersCollection;
    public constructor() {
        this.listeners = {};
        this.rootNode = {};
    }
    get(id: DataNodePath): DataNodeReference {
        if (!id) {
            throw new Error("Cannot get with undefined id");
        }
        const path = Array.isArray(id) ? id : [id];
        const reference = this.createReference(path);
        return reference;
    }
    get data(): Json {
        return JSON.parse(JSON.stringify(this.rootNode));
    }
    private dispatchChangeEvent(
        path: string[],
        data: DataNode,
        operation: ChangeOperation
    ) {
        const changeEvent: NodeChangeEvent = {
            data,
            operation,
            path
        };
        for (let i = 1; i <= path.length; i++) {
            const subPath = path.slice(0, i);
            const listeners = this.listeners[concatPath(subPath)];
            if (!!listeners) {
                Object.values(listeners).forEach((listener, idx) => {
                    console.log(
                        `Running listener ${idx} for path ${concatPath(
                            subPath
                        )} `
                    );
                    listener(changeEvent);
                });
            }
        }
    }
    private getPath(path: string[], createIfNeeded?: boolean): DataNode {
        if (path.length == 0) {
            throw new Error("Invalid path, cannot be zero length");
        }
        let lookupNode = this.rootNode;
        for (let i = 0; i < path.length; i++) {
            const currentKey = path[i];
            if (!!lookupNode[currentKey]) {
                lookupNode = lookupNode[currentKey];
            } else {
                if (createIfNeeded) {
                    lookupNode[currentKey] = {};
                    lookupNode = lookupNode[currentKey];
                } else {
                    return null;
                }
            }
        }
        return lookupNode;
    }
    private getParent(path: string[]): DataNode {
        if (path.length == 1) {
            return this.rootNode;
        } else {
            return this.getPath(path.slice(0, path.length - 1), true);
        }
    }
    private getValue<T extends Json>(path: string[]): T {
        return this.getPath(path) as T;
    }
    private pushToStorageNode(path: string[], data: Json): DataNodeReference {
        const node = this.getPath(path, true);
        const pushId = getRandomString();
        if (typeof node === "object") {
            node[pushId] = data;
            this.dispatchChangeEvent(path, data, ChangeOperation.Add);
        } else {
            console.error(`cannot push to non object ${path}`);
        }
        const createdReference = this.createReference(path.concat([pushId]));
        return createdReference;
    }
    private setOnStorageNode(path: string[], data: Json): DataNodeReference {
        const node = this.getPath(path, true);
        const parentNode = this.getParent(path);
        if (typeof data !== typeof node) {
            console.warn(
                `Changing type of ${path} from ${typeof node} to ${typeof data}`
            );
        }
        parentNode[path[path.length - 1]] = data;
        this.dispatchChangeEvent(path, data, ChangeOperation.Set);
        const createdReference = this.createReference(path);
        return createdReference;
    }
    private removeStorageNode(path: string[]) {
        const node = this.getPath(path);
        if (!!node) {
            const parentNode = this.getParent(path);
            delete parentNode[path[path.length - 1]];
            this.dispatchChangeEvent(path, null, ChangeOperation.Remove);
        } else {
            console.warn("Tried to delete non exisiting path", path);
        }
    }
    private registerListener(
        path: string[],
        listener: EventSubscriptionHandler<NodeChangeEvent>
    ): EventHandle {
        const pathString = concatPath(path);
        let pathGroup = this.listeners[pathString];
        if (!pathGroup) {
            this.listeners[pathString] = {};
            pathGroup = this.listeners[pathString];
        }
        const handleId = getRandomString("e");
        pathGroup[handleId] = listener;
        const removeListenerHandle = () => {
            if (!!pathGroup && !!pathGroup[handleId]) {
                delete pathGroup[handleId];
            } else {
                console.debug("Handle already disposed");
            }
        };
        return removeListenerHandle;
    }
    private createReference(path: string[]): DataNodeReference {
        const get = (nodePath: DataNodePath) => {
            return this.createReference(path.concat(nodePath));
        };
        const push = (data: Json) => {
            return this.pushToStorageNode(path, data);
        };
        const set = (data: Json) => {
            return this.setOnStorageNode(path, data);
        };
        const value = <T extends Json>(): T => {
            return this.getValue(path);
        };
        const listen = (
            listener: EventSubscriptionHandler<NodeChangeEvent>
        ) => {
            return this.registerListener(path, listener);
        };
        const remove = (): void => {
            this.removeStorageNode(path);
        };
        return {
            get,
            push,
            set,
            path,
            value,
            listen,
            remove
        };
    }
}

export function pathsEqual(pathA: string[], pathB: string[]) {
    if (pathA.length !== pathB.length) {
        return false;
    }
    for (let i = 0; i < pathA.length; i++) {
        if (pathA[i] !== pathB[i]) {
            return false;
        }
    }
    return true;
}

export function concatPath(path: string[]): string {
    return path.join("/");
}

const firstOfJan2019 = 1546304400000;
const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export function getRandomString(prefix?: string): string {
    let text = "";

    for (let i = 0; i < 12; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    const id = "k" + (Date.now() - firstOfJan2019) + text;
    return id;
}

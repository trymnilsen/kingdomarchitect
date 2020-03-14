"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ChangeOperation;
(function (ChangeOperation) {
    ChangeOperation[ChangeOperation["Add"] = 0] = "Add";
    ChangeOperation[ChangeOperation["Set"] = 1] = "Set";
    ChangeOperation[ChangeOperation["Remove"] = 2] = "Remove";
})(ChangeOperation = exports.ChangeOperation || (exports.ChangeOperation = {}));
class DataTree {
    constructor() {
        this.listeners = {};
        this.rootNode = {};
    }
    get(id) {
        if (!id) {
            throw new Error("Cannot get with undefined id");
        }
        const path = Array.isArray(id) ? id : [id];
        const reference = this.createReference(path);
        return reference;
    }
    get data() {
        return JSON.parse(JSON.stringify(this.rootNode));
    }
    dispatchChangeEvent(path, data, operation) {
        const changeEvent = {
            data,
            operation,
            path
        };
        for (let i = 1; i <= path.length; i++) {
            const subPath = path.slice(0, i);
            const listeners = this.listeners[concatPath(subPath)];
            if (!!listeners) {
                Object.values(listeners).forEach((listener, idx) => {
                    console.log(`Running listener ${idx} for path ${concatPath(subPath)} `);
                    listener(changeEvent);
                });
            }
        }
    }
    getPath(path, createIfNeeded) {
        if (path.length == 0) {
            throw new Error("Invalid path, cannot be zero length");
        }
        let lookupNode = this.rootNode;
        for (let i = 0; i < path.length; i++) {
            const currentKey = path[i];
            if (!!lookupNode[currentKey]) {
                lookupNode = lookupNode[currentKey];
            }
            else {
                if (createIfNeeded) {
                    lookupNode[currentKey] = {};
                    lookupNode = lookupNode[currentKey];
                }
                else {
                    return null;
                }
            }
        }
        return lookupNode;
    }
    getParent(path) {
        if (path.length == 1) {
            return this.rootNode;
        }
        else {
            return this.getPath(path.slice(0, path.length - 1), true);
        }
    }
    getValue(path) {
        return this.getPath(path);
    }
    pushToStorageNode(path, data) {
        const node = this.getPath(path, true);
        const pushId = getRandomString();
        if (typeof node === "object") {
            node[pushId] = data;
            this.dispatchChangeEvent(path, data, ChangeOperation.Add);
        }
        else {
            console.error(`cannot push to non object ${path}`);
        }
        const createdReference = this.createReference(path.concat([pushId]));
        return createdReference;
    }
    setOnStorageNode(path, data) {
        const node = this.getPath(path, true);
        const parentNode = this.getParent(path);
        if (typeof data !== typeof node) {
            console.warn(`Changing type of ${path} from ${typeof node} to ${typeof data}`);
        }
        parentNode[path[path.length - 1]] = data;
        this.dispatchChangeEvent(path, data, ChangeOperation.Set);
        const createdReference = this.createReference(path);
        return createdReference;
    }
    removeStorageNode(path) {
        const node = this.getPath(path);
        if (!!node) {
            const parentNode = this.getParent(path);
            delete parentNode[path[path.length - 1]];
            this.dispatchChangeEvent(path, null, ChangeOperation.Remove);
        }
        else {
            console.warn("Tried to delete non exisiting path", path);
        }
    }
    registerListener(path, listener) {
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
            }
            else {
                console.debug("Handle already disposed");
            }
        };
        return removeListenerHandle;
    }
    createReference(path) {
        const get = (nodePath) => {
            return this.createReference(path.concat(nodePath));
        };
        const push = (data) => {
            return this.pushToStorageNode(path, data);
        };
        const set = (data) => {
            return this.setOnStorageNode(path, data);
        };
        const value = () => {
            return this.getValue(path);
        };
        const listen = (listener) => {
            return this.registerListener(path, listener);
        };
        const remove = () => {
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
exports.DataTree = DataTree;
function pathsEqual(pathA, pathB) {
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
exports.pathsEqual = pathsEqual;
function concatPath(path) {
    return path.join("/");
}
exports.concatPath = concatPath;
const firstOfJan2019 = 1546304400000;
const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function getRandomString(prefix) {
    let text = "";
    for (let i = 0; i < 12; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    const id = "k" + (Date.now() - firstOfJan2019) + text;
    return id;
}
exports.getRandomString = getRandomString;
//# sourceMappingURL=dataNode.js.map
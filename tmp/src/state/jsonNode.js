"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const event_1 = require("../event/event");
const string_1 = require("../util/string");
const firstOfJan2019 = 1546304400000;
var JsonNodeType;
(function (JsonNodeType) {
    JsonNodeType[JsonNodeType["Container"] = 0] = "Container";
    JsonNodeType[JsonNodeType["String"] = 1] = "String";
    JsonNodeType[JsonNodeType["Boolean"] = 2] = "Boolean";
    JsonNodeType[JsonNodeType["Number"] = 3] = "Number";
})(JsonNodeType = exports.JsonNodeType || (exports.JsonNodeType = {}));
var ChangeOperation;
(function (ChangeOperation) {
    ChangeOperation[ChangeOperation["Removed"] = 0] = "Removed";
    ChangeOperation[ChangeOperation["Added"] = 1] = "Added";
})(ChangeOperation = exports.ChangeOperation || (exports.ChangeOperation = {}));
class JsonNode {
    constructor(parent, type, id) {
        this._children = {};
        this._id = id || getId();
        this._type = type;
        this.parent = parent;
        this.changeEvent = new event_1.Event();
    }
    get(id) {
        if (!id) {
            console.warn("Trying to get node with undefined id, returning null");
            return null;
        }
        //If array is provided recurse into children
        if (Array.isArray(id)) {
            //If the array is larger than one fetch the children with
            //id of first element and then pass the rest to the child
            if (id.length > 1) {
                const firstChild = this._children[id[0]];
                if (!!firstChild) {
                    const newId = id.slice(1, id.length);
                    return firstChild.get(newId);
                }
                else {
                    return null;
                }
            }
            else if (id.length === 1) {
                //if only one element is present in array treat it as the id
                return this.get(id[0]);
            }
            else {
                return null;
            }
        }
        else {
            const child = this._children[id];
            return child;
        }
    }
    put(id, data) {
        if (string_1.isBlank(id)) {
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
    set(data) {
        //Create json node from data
        const dataAsJsonNode = dataToJsonNode(this.parent, data);
        //Remove each node so we can dispose them
        this.getChildrenAsArray().forEach((x) => x.remove());
        //set the children of the create data node to this
        this.children = dataAsJsonNode.children;
        this.dispatchEvent({
            node: this,
            operation: ChangeOperation.Added
        });
    }
    push(data) {
        const dataAsJsonNode = dataToJsonNode(this, data);
        this._children[dataAsJsonNode.id] = dataAsJsonNode;
        this.dispatchEvent({
            node: dataAsJsonNode,
            operation: ChangeOperation.Added
        });
        return dataAsJsonNode;
    }
    listen(listener) {
        return this.changeEvent.listen(listener);
    }
    removeChild(id) {
        const deletedElement = this._children[id];
        if (!!deletedElement) {
            delete this._children[id];
            deletedElement.dispatchEvent({
                node: deletedElement,
                operation: ChangeOperation.Removed
            });
            deletedElement.dispose();
            return true;
        }
        else {
            console.warn(`Cannot delete ${id} not found in children`);
            return false;
        }
    }
    remove() {
        if (!this.parent) {
            throw new Error("Cannot remove root node");
        }
        this.parent.removeChild(this._id);
    }
    dispose() {
        this.changeEvent.dispose();
        Object.values(this._children).forEach((child) => child.dispose());
    }
    dispatchEvent(event) {
        this.changeEvent.publish(event);
        if (!event.cancelBubbling) {
            if (!!this.parent) {
                this.parent.dispatchEvent(event);
            }
        }
    }
    getChildrenAsArray() {
        return Object.values(this._children);
    }
    value() {
        return this.toData();
    }
    get id() {
        return this._id;
    }
    set id(id) {
        this._id = id;
    }
    get children() {
        return this._children;
    }
    set children(children) {
        this._children = children;
    }
    get path() {
        return (!!this.parent ? this.parent.path : []).concat([this.id]);
    }
    get size() {
        return Object.values(this._children).length;
    }
    get type() {
        return this._type;
    }
}
exports.JsonNode = JsonNode;
class JsonNodeContainer extends JsonNode {
    constructor(parent) {
        super(parent, JsonNodeType.Container);
    }
    toData() {
        const result = {};
        for (const key in this._children) {
            if (this._children.hasOwnProperty(key)) {
                const element = this._children[key];
                result[element.id] = element.toData();
            }
        }
        return result;
    }
}
exports.JsonNodeContainer = JsonNodeContainer;
class JsonTree extends JsonNodeContainer {
    constructor() {
        super(null);
        this.id = JsonTree.RootNodeId;
    }
}
JsonTree.RootNodeId = "root";
exports.JsonTree = JsonTree;
class JsonNodeField extends JsonNode {
    constructor(parent, type, value) {
        super(parent, type);
        this._value = value;
    }
    toData() {
        return this._value;
    }
}
exports.JsonNodeField = JsonNodeField;
const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function getId() {
    let text = "";
    for (let i = 0; i < 12; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    const id = "k" + (Date.now() - firstOfJan2019) + text;
    return id;
}
exports.getId = getId;
function getNodeValue(node) {
    if (!node) {
        return null;
    }
    if (node.type === JsonNodeType.Container) {
        return null;
    }
    const nodeAsField = node;
    return nodeAsField.value();
}
exports.getNodeValue = getNodeValue;
function getIdToString(id) {
    if (Array.isArray(id)) {
        return `['${id.join("','")}']`;
    }
    else {
        return id;
    }
}
function dataToJsonNode(parent, data) {
    const dataType = typeof data;
    switch (dataType) {
        case "boolean":
            return new JsonNodeField(parent, JsonNodeType.Boolean, data);
            break;
        case "number":
            return new JsonNodeField(parent, JsonNodeType.Number, data);
            break;
        case "string":
            return new JsonNodeField(parent, JsonNodeType.String, data);
            break;
        case "object":
            return dataObjectToJsonNode(parent, data);
            break;
        default:
            throw new Error("Invalid datatype " + dataType);
    }
}
function dataObjectToJsonNode(parent, data) {
    const container = new JsonNodeContainer(parent);
    if (Array.isArray(data)) {
        data.forEach((item) => {
            container.push(item);
        });
    }
    else {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const element = data[key];
                container.put(key, element);
            }
        }
    }
    return container;
}
//# sourceMappingURL=jsonNode.js.map
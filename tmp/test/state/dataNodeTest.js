"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dataNode_1 = require("../../src/state/dataNode");
describe("Get data", () => {
    test("can get node reference", () => {
        const tree = new dataNode_1.DataTree();
        const reference = tree.get(["foo", "bar"]);
        expect(reference.path).toEqual(["foo", "bar"]);
    });
});
describe("push data", () => {
    test("Can push data", () => {
        const tree = new dataNode_1.DataTree();
        const reference = tree.get(["foo"]);
        reference.push({
            baz: 5,
            bar: "hello"
        });
        console.log(tree.data);
    });
});
//# sourceMappingURL=dataNodeTest.js.map
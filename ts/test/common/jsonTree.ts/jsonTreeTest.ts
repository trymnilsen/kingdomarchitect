import {
    JsonNodeField,
    ChangeOperation,
    JsonNode,
    JsonNodeType,
    getNodeValue,
    getId,
    JsonTree
} from "../../../src/util/jsontree/jsonNode";
import { json } from "body-parser";

describe("JsonTree", () => {
    describe("push", () => {
        it("can push data", () => {
            const jsonTree = new JsonTree();
            const item1 = jsonTree.push("hello");
            const item2 = jsonTree.push(true);
            const getItem1 = jsonTree.get(item1.id);
            const getItem2 = jsonTree.get(item2.id);
            expect(getItem1).not.toBeNull();
            expect(getItem2).not.toBeNull();
            expect(getItem1.id).toBe(item1.id);
            expect(getItem2.id).toBe(item2.id);
        });
        it("can set parent of created nodes", () => {});
    });

    describe("put", () => {
        it("can put data", () => {
            const jsonTree = new JsonTree();
            jsonTree.put("foobar", "someputid");
            const getItem = jsonTree.get("someputid");
            expect(getItem).not.toBeNull();
            expect(getItem.id).toBe("someputid");
        });
        it("put disposes and removes exisiting node", () => {
            const jsonTree = new JsonTree();
            jsonTree.put("foobar", "someputid");
            let getItem = jsonTree.get("someputid") as JsonNodeField<string>;
            expect(getItem.value).toBe("foobar");
            expect(getItem.id).toBe("someputid");
            jsonTree.put("hello", "someputid");
            getItem = jsonTree.get("someputid") as JsonNodeField<string>;
            expect(getItem.value).toBe("hello");
            expect(getItem.id).toBe("someputid");
        });
    });

    describe("replace", () => {
        it("can replace the tree", () => {
            const jsonTree = new JsonTree();
            const item1 = jsonTree.push("one");
            const item2 = jsonTree.push("two");
            const item3 = jsonTree.push("three");

            jsonTree.replace({
                hello: "hellodata",
                hi: "hidata",
                hey: {
                    yall: "yalldata",
                    howdy: "howdydata"
                }
            });
            const ids = jsonTree.getChildrenAsArray().map((x) => x.id);
            expect(ids).not.toContain(item1.id);
            expect(ids).not.toContain(item2.id);
            expect(ids).not.toContain(item3.id);
            expect(ids.length).toBe(3);
            expect(ids).toContain("hello");
            expect(ids).toContain("hi");
            expect(ids).toContain("hey");
            const heyIds = jsonTree
                .get("hey")
                .getChildrenAsArray()
                .map((x) => x.id);

            expect(heyIds).toContain("yall");
            expect(heyIds).toContain("howdy");
        });
    });

    describe("get", () => {
        it("can get nested data", () => {
            const jsonTree = new JsonTree();
            const item1 = jsonTree.push("one");
            const item2 = item1.push("two");
            const item3 = item2.push("three");

            const get3via2and1 = jsonTree.get([item1.id, item2.id, item3.id]);
            const get3Via2 = item1.get([item2.id, item3.id]);
            const get3 = item2.get([item3.id]);
            const get3WithoutArray = item2.get(item3.id);

            expect(get3via2and1).not.toBeNull();
            expect(get3Via2).not.toBeNull();
            expect(get3).not.toBeNull();
            expect(get3WithoutArray).not.toBeNull();
            expect(get3via2and1.id).toBe(item3.id);
        });
        it("non existing nested get gives null", () => {
            const jsonTree = new JsonTree();
            const item1 = jsonTree.push("one");
            const item2 = item1.push("two");
            const nonexisting = jsonTree.get([
                item1.id,
                item2.id,
                "foo",
                "bar"
            ]);
            expect(nonexisting).toBeNull();
        });
    });

    describe("can remove nodes", () => {
        it("can remove by calling remove() on node", () => {
            const jsonTree = new JsonTree();
            const item1 = jsonTree.push("one");
            const item2 = jsonTree.push("two");
            expect(jsonTree.size).toBe(2);
            item2.remove();
        });
        it("cannot remove root node", () => {
            const jsonTree = new JsonTree();
            expect(() => {
                jsonTree.remove();
            }).toThrow("Cannot remove root node");
        });
    });

    describe("Events should be triggered when tree is mutated", () => {
        it("can trigger events on remove", () => {
            let removeCalled = false;
            const jsonTree = new JsonTree();
            const item1 = jsonTree.push("one");
            jsonTree.listen((event) => {
                if (event.operation === ChangeOperation.Removed) {
                    removeCalled = true;
                    expect(event.node.id).toBe(item1.id);
                }
            });
            item1.remove();
            expect(removeCalled).toBe(true);
        });
        it("can trigger events on add", () => {
            let addCalled = false;
            const jsonTree = new JsonTree();
            jsonTree.listen((event) => {
                if (event.operation === ChangeOperation.Added) {
                    addCalled = true;
                    const value = (event.node as JsonNodeField<string>).value;
                    expect(value).toBe("one");
                }
            });
            const item1 = jsonTree.push("one");
            expect(addCalled).toBe(true);
        });
        it("can bubble events", () => {
            const jsonTree = new JsonTree();
            let callbacks = 0;
            jsonTree.listen((event) => {
                callbacks += 1;
            });
            const item1 = jsonTree.push("one");
            const item2 = item1.push("two");
            const item3 = item2.push("three");
            expect(callbacks).toBe(3);
        });
        it("can cancel bubbling of events", () => {
            const jsonTree = new JsonTree();
            let item1CallbackRecieved = false;
            const item1 = jsonTree.push("one");
            jsonTree.listen((event) => {
                fail("Should not reach root listener");
            });
            item1.listen((event) => {
                item1CallbackRecieved = true;
                event.cancelBubbling = true;
            });
            const item2 = item1.push("two");
            const item3 = item2.push("three");
            expect(item1CallbackRecieved).toBe(true);
        });
    });

    describe("Methods related to how data is handled", () => {
        const nestedObject = {
            booleanField: true,
            stringField: "hello",
            nestedField: {
                nestedBooleanField: false,
                nestedNumberField: 1337
            },
            arrayField: ["arrayValueOne", "arrayValueTwo", 42]
        };
        it("can turn a json structure into an object tree", () => {
            const jsonTree = new JsonTree();
            jsonTree.put(nestedObject, "test");
            const node = jsonTree.get("test");
            expect(
                node.getChildrenAsArray().every((x) => {
                    return (
                        x.type === JsonNodeType.Container ||
                        x.type === JsonNodeType.String ||
                        x.type === JsonNodeType.Boolean
                    );
                })
            ).toBe(true);
            expect(node.size).toBe(4);

            //Validate that the ids of the fields are the same as the property key
            //used to generate node
            expect(node.get("stringField")).not.toBeNull();
            expect(getNodeValue(node.get("stringField"))).toBe("hello");
            const nestedNumber = node.getValue<number>([
                "nestedField",
                "nestedNumberField"
            ]);
            expect(nestedNumber).not.toBeNull();
            expect(nestedNumber).toBe(1337);
        });
        it("can turn array into an jsonNodeContainer", () => {
            const items = ["one", "two", "three"];
            const jsonTree = new JsonTree();
            jsonTree.put(items, "arraytest");
            jsonTree
                .get("arraytest")
                .getChildrenAsArray()
                .every(
                    (x) =>
                        !!x.id &&
                        x.type === JsonNodeType.String &&
                        items.includes(getNodeValue(x))
                );
        });
        it("can turn object tree into raw json", () => {
            const jsonTree = new JsonTree();
            jsonTree.put(nestedObject, "toJsonTest");
            const jsonOutput = jsonTree.toData();
        });
    });

    describe("Utils", () => {
        it("can create path names", () => {
            const jsonTree = new JsonTree();
            const item1 = jsonTree.put("path1data", "one");
            const item2 = item1.put("path2data", "two");
            const item3 = item2.put("path3data", "three");
            expect(item3.path.length).toBe(4);
            expect(item3.path[0]).toBe(JsonTree.RootNodeId);
            expect(item3.path[1]).toBe(item1.id);
            expect(item3.path[2]).toBe(item2.id);
            expect(item3.path[3]).toBe(item3.id);
        });
        it("can create ids", () => {
            const id1 = getId();
            const id2 = getId();
            const id3 = getId();
            expect(id1).not.toBeFalsy();
            expect(id2).not.toBeFalsy();
            expect(id3).not.toBeFalsy();
            expect(id1.charAt(0)).toBe("k");
            expect(id2.charAt(0)).toBe("k");
            expect(id2.charAt(0)).toBe("k");
            expect([id2, id3]).not.toContain(id1);
        });
    });
});

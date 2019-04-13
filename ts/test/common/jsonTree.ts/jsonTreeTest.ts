import { JsonTree } from "../../../src/common/jsontree/jsonTree";

describe("JsonTree", () => {
    describe("Push put and get", () => {
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
        it("can put data", () => {

        });
        it("can get data", () => {

        });
        it("can get nested data", () => {

        });
        it("can push to subnode", () => {

        });
        it("can remove data", () => {

        });
    });
    describe("Events", () => {
        it("can trigger events on remove", () => {

        });
        it("can trigger events on add", () => {

        });
        it("can bubble events", () => {

        });
    });
    describe("Data", () => {
        it("can turn a json structure into an object tree", () => {

        });
        it("can turn object tree into raw json", () => {

        });
    });
    describe("Utils", () => {
        it("can create path names", () => {

        });
        it("can create sortable ids", () => {

        });
    });

});

import { assert } from "chai";
import { Entity } from "../../../../../src/game/world/entity/entity";
import { visitChildren } from "../../../../../src/game/world/entity/child/visit";

describe("Visit tests", () => {
    it("Visit entities breadth first", () => {
        const root = new Entity("root");
        const parent1 = new Entity("parent1");
        const parent2 = new Entity("parent2");
        const child1 = new Entity("child1");
        const child2 = new Entity("child2");
        const child3 = new Entity("child3");
        const grandChild1 = new Entity("grandchild1");
        const grandChild2 = new Entity("grandchild2");

        root.addChild(parent1);
        root.addChild(parent2);
        parent1.addChild(child1);
        parent1.addChild(child2);
        parent2.addChild(child3);
        child1.addChild(grandChild1);
        child2.addChild(grandChild2);

        const ids: string[] = [];
        visitChildren(root, (entity) => {
            ids.push(entity.id);
            return false;
        });

        assert.deepEqual(ids, [
            "root",
            "parent1",
            "parent2",
            "child1",
            "child2",
            "child3",
            "grandchild1",
            "grandchild2",
        ]);
    });

    it("Will stop visiting on true", () => {
        const root = new Entity("root");
        const parent1 = new Entity("parent1");
        const parent2 = new Entity("parent2");

        root.addChild(parent1);
        root.addChild(parent2);

        const ids: string[] = [];
        visitChildren(root, (entity) => {
            ids.push(entity.id);
            return true;
        });

        assert.deepEqual(ids, ["root"]);
    });
});

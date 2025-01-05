import { describe, it, expect } from "vitest";
import {
    placeWithTilesplit,
    QuadTree,
} from "../../../src/common/structure/quadtree.js";
import { intersectRect } from "../../../src/common/structure/rectangle.js";

describe("tilesetPlacer", () => {
    it("Can get three places", () => {
        const quadTree = new QuadTree({ x: 0, y: 0, width: 32, height: 32 });
        //add the initial space
        quadTree.insert({ x: 0, y: 0, width: 32, height: 32 });
        const width = 4;
        const height = 4;

        const first = placeWithTilesplit(quadTree, width, height);
        const second = placeWithTilesplit(quadTree, width, height);
        const third = placeWithTilesplit(quadTree, width, height);

        expect(first).not.toBeNull();
        expect(second).not.toBeNull();
        expect(third).not.toBeNull();
        expect(intersectRect(first!, second!)).toBeFalsy();
        expect(intersectRect(second!, third!)).toBeFalsy();
        expect(intersectRect(third!, first!)).toBeFalsy();
    });
});

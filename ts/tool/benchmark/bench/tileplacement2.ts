import {
    placeWithTilesplit,
    QuadTree,
} from "../../../src/common/structure/quadtree.js";

const quadTree = new QuadTree({ x: 0, y: 0, width: 32, height: 32 });
//add the initial space
quadTree.insert({ x: 0, y: 0, width: 32, height: 32 });
const width = 2;
const height = 2;
for (let i = 0; i < 250; i++) {
    placeWithTilesplit(quadTree, width, height);
}

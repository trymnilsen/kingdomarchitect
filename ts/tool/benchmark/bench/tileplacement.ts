import { encodePosition, Point } from "../../../src/common/point.js";
import {
    placeWithTilesplit,
    QuadTree,
} from "../../../src/common/structure/quadtree.js";
import {
    Rectangle,
    splitRectangle,
} from "../../../src/common/structure/rectangle.js";
import { logTable, MiniBench } from "../miniBench.js";

const bench = new MiniBench("tileplacment", 1);

function place(
    width: number,
    height: number,
    quadTree: QuadTree,
): Point | null {
    for (let x = 0; x < 32 - width; x++) {
        for (let y = 0; y < 32 - height; y++) {
            const query = quadTree.query({ x, y, width, height });
            if (query.length == 0) {
                return { x, y };
            }
        }
    }

    return null;
}
/*
bench.add({
    name: "Loop and check",
    run: () => {
        const quadTree = new QuadTree({ x: 0, y: 0, width: 32, height: 32 });
        for (let i = 0; i < 100; i++) {
            const result = place(4, 4, quadTree);
            if (!!result) {
                quadTree.insert({
                    x: result.x,
                    y: result.y,
                    width: 4,
                    height: 4,
                });
            }
        }
    },
});

bench.add({
    name: "Loop and check - 250",
    run: () => {
        const quadTree = new QuadTree({ x: 0, y: 0, width: 32, height: 32 });
        for (let i = 0; i < 250; i++) {
            const result = place(2, 2, quadTree);
            if (!!result) {
                quadTree.insert({
                    x: result.x,
                    y: result.y,
                    width: 2,
                    height: 2,
                });
            }
        }
    },
});*/

function* gridIterator(
    rows: number,
    cols: number,
    skipRegion: (x: number, y: number) => boolean,
): Generator<[number, number]> {
    // Generate a random starting point
    const startRow = Math.floor(Math.random() * rows);
    const startCol = Math.floor(Math.random() * cols);

    // Iterate through all cells, starting from the random position
    /*
    for (let i = 0; i < rows * cols; i++) {
        const row = (startRow + Math.floor((startCol + i) / cols)) % rows;
        const col = (startCol + i) % cols;
        if (skipRegion(row, col)) {
            continue;
        }
        yield [row, col];
    }*/

    for (let row = 0; row < rows; row++) {
        const offsetRow = (row + startRow) % rows;
        for (let col = 0; col < cols; col++) {
            // Skip the region if the condition is true
            const offsetCol = (col + startCol) % cols;
            if (skipRegion(offsetRow, offsetCol)) {
                continue;
            }
            yield [offsetRow, offsetCol];
        }
    }
}

function getRectangleIntersection(
    rect1: Rectangle,
    rect2: Rectangle,
): Rectangle | null {
    // Calculate the boundaries of the intersection
    const x1 = Math.max(rect1.x, rect2.x);
    const y1 = Math.max(rect1.y, rect2.y);
    const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

    // Check if the rectangles overlap
    if (x1 < x2 && y1 < y2) {
        return {
            x: x1,
            y: y1,
            width: x2 - x1,
            height: y2 - y1,
        };
    }

    // No intersection
    return null;
}

bench.add({
    name: "grid iterator with set - 100",
    run: () => {
        const quadTree = new QuadTree({ x: 0, y: 0, width: 32, height: 32 });
        const skipRegion = (x: number, y: number) => {
            return skipSet.has(encodePosition(x, y));
        };
        const skipSet = new Set<number>();

        for (let i = 0; i < 100; i++) {
            for (const [row, col] of gridIterator(32, 32, skipRegion)) {
                const rect = {
                    x: row,
                    y: col,
                    width: 4,
                    height: 4,
                };
                const result = quadTree.query(rect);
                if (result.length == 0) {
                    quadTree.insert({ x: row, y: col, width: 4, height: 4 });
                    break;
                } else {
                    for (const collision of result) {
                        const intersection = getRectangleIntersection(
                            rect,
                            collision,
                        );
                        if (intersection) {
                            for (let x = 0; x < intersection.width; x++) {
                                for (let y = 0; y < intersection.height; y++) {
                                    skipSet.add(
                                        encodePosition(
                                            intersection.x + x,
                                            intersection.y + y,
                                        ),
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }
    },
});

bench.add({
    name: "grid iterator with set - 250",
    run: () => {
        const quadTree = new QuadTree({ x: 0, y: 0, width: 32, height: 32 });
        const skipRegion = (x: number, y: number) => {
            return skipSet.has(encodePosition(x, y));
        };
        const skipSet = new Set<number>();

        for (let i = 0; i < 250; i++) {
            for (const [row, col] of gridIterator(32, 32, skipRegion)) {
                const rect = {
                    x: row,
                    y: col,
                    width: 2,
                    height: 2,
                };
                const result = quadTree.query(rect);
                if (result.length == 0) {
                    quadTree.insert({ x: row, y: col, width: 2, height: 2 });
                    break;
                } else {
                    for (const collision of result) {
                        const intersection = getRectangleIntersection(
                            rect,
                            collision,
                        );
                        if (intersection) {
                            for (let x = 0; x < intersection.width; x++) {
                                for (let y = 0; y < intersection.height; y++) {
                                    skipSet.add(
                                        encodePosition(
                                            intersection.x + x,
                                            intersection.y + y,
                                        ),
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }
    },
});

bench.add({
    name: "rectangle split - 100",
    run: () => {
        const quadTree = new QuadTree({ x: 0, y: 0, width: 32, height: 32 });
        //add the initial space
        quadTree.insert({ x: 0, y: 0, width: 32, height: 32 });
        const width = 4;
        const height = 4;
        for (let i = 0; i < 100; i++) {
            placeWithTilesplit(quadTree, width, height);
        }
    },
});

bench.add({
    name: "rectangle split - 250",
    run: () => {
        const quadTree = new QuadTree({ x: 0, y: 0, width: 32, height: 32 });
        //add the initial space
        quadTree.insert({ x: 0, y: 0, width: 32, height: 32 });
        const width = 2;
        const height = 2;
        for (let i = 0; i < 250; i++) {
            placeWithTilesplit(quadTree, width, height);
        }
    },
});

const result = bench.run();
logTable(result);

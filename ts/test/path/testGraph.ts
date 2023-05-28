import { assert } from "chai";
import getPixels from "get-pixels";
import { NdArray } from "ndarray";
import * as path from "path";
import { Point, pointEquals, zeroPoint } from "../../src/common/point";

export async function createGraphFromTestFile(
    mazeName: string
): Promise<TestGraph> {
    const directory = path.join(process.cwd(), "ts", "test", "path", "mazes");

    const pixels = await getPixelsAsync(path.join(directory, mazeName));
    const width = pixels.shape[0];
    const height = pixels.shape[1];
    const expectedPath: ExpectedPath = {};
    let start: Point = zeroPoint();
    let stop: Point = zeroPoint();

    const weightGraph: number[][] = [];
    for (let x = 0; x < width; x++) {
        weightGraph[x] = [];
        for (let y = 0; y < height; y++) {
            const pixel = {
                r: pixels.get(x, y, 0),
                g: pixels.get(x, y, 1),
                b: pixels.get(x, y, 2),
            };

            if (pixel.b == 255 && pixel.r == 0 && pixel.g == 0) {
                expectedPath[pointId(x, y)] = { x, y };
            }

            if (pixel.b == 0 && pixel.r == 255 && pixel.g == 0) {
                start = { x, y };
            }

            if (pixel.b == 0 && pixel.r == 0 && pixel.g == 255) {
                stop = { x, y };
            }
            weightGraph[x][y] = averageColor(pixel.r, pixel.g, pixel.b);
        }
    }

    return {
        graph: weightGraph,
        expectedPath,
        start,
        stop,
    };
}

export function verifyPath(resultingPath: Point[], graph: TestGraph) {
    // If the last path point is the end, pop it from the path to avoid failing
    // comparing the result path and the expected path
    if (pointEquals(resultingPath[resultingPath.length - 1], graph.stop)) {
        resultingPath.pop();
    }
    const expectedPointsCopy = Object.assign({}, graph.expectedPath);

    for (const point of resultingPath) {
        const id = pointId(point.x, point.y);
        const pointIsExpected = expectedPointsCopy[id];
        if (!pointIsExpected) {
            assert.fail(`Point not expected ${id}`);
        } else {
            delete expectedPointsCopy[id];
        }
    }

    const expectedPointsLeft = Object.values(expectedPointsCopy).length;
    assert.equal(
        expectedPointsLeft,
        0,
        "All expected points not visited by resulting path"
    );
}

async function getPixelsAsync(path: string): Promise<NdArray<Uint8Array>> {
    return new Promise((resolve, reject) => {
        getPixels(path, (error, pixels) => {
            if (!!error) {
                reject(error);
            } else {
                resolve(pixels);
            }
        });
    });
}

type ExpectedPath = { [pointKey: string]: Point };

interface TestGraph {
    graph: number[][];
    start: Point;
    stop: Point;
    expectedPath: ExpectedPath;
}

function pointId(x: number, y: number) {
    return `x${x}y${y}`;
}

function averageColor(r: number, g: number, b: number): number {
    return (r + g + b) / 3;
}

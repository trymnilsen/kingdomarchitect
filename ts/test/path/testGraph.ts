import * as assert from "node:assert";
import * as path from "path";
import { Point, pointEquals, zeroPoint } from "../../src/common/point.js";
import { getPixelColor, readPng } from "../../tool/spritepack/pngHelper.js";

export async function createGraphFromTestFile(
    mazeName: string,
): Promise<TestGraph> {
    let currentDirectory = process.cwd();
    //If the current directory contains the build folder, we should jump out to
    //the root of the repo first
    if (currentDirectory.includes("build")) {
        const currentDirectorySegments = currentDirectory.split(path.sep);
        while (currentDirectorySegments.length > 0) {
            const directory = currentDirectorySegments.pop();
            if (directory == "build") {
                break;
            }
        }

        currentDirectory = path.join(path.sep, ...currentDirectorySegments);
    }

    const directory = path.join(
        currentDirectory,
        "ts",
        "test",
        "path",
        "mazes",
    );

    const png = readPng(path.join(directory, mazeName));

    const width = png.width;
    const height = png.height;
    const expectedPath: ExpectedPath = {};
    let start: Point = zeroPoint();
    let stop: Point = zeroPoint();

    const weightGraph: number[][] = [];
    for (let x = 0; x < width; x++) {
        weightGraph[x] = [];
        for (let y = 0; y < height; y++) {
            const pixel = getPixelColor(png, x, y);

            if (pixel.blue == 255 && pixel.red == 0 && pixel.green == 0) {
                expectedPath[pointId(x, y)] = { x, y };
            }

            if (pixel.blue == 0 && pixel.red == 255 && pixel.green == 0) {
                start = { x, y };
            }

            if (pixel.blue == 0 && pixel.red == 0 && pixel.green == 255) {
                stop = { x, y };
            }
            weightGraph[x][y] = averageColor(
                pixel.red,
                pixel.green,
                pixel.blue,
            );
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
        "All expected points not visited by resulting path",
    );
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

import { assert } from "chai";
import getPixels from "get-pixels";
import * as path from "path";
import { pointEquals, zeroPoint } from "../../src/common/point.js";
export async function createGraphFromTestFile(mazeName) {
    const directory = path.join(process.cwd(), "ts", "test", "path", "mazes");
    const pixels = await getPixelsAsync(path.join(directory, mazeName));
    const width = pixels.shape[0];
    const height = pixels.shape[1];
    const expectedPath = {};
    let start = zeroPoint();
    let stop = zeroPoint();
    const weightGraph = [];
    for(let x = 0; x < width; x++){
        weightGraph[x] = [];
        for(let y = 0; y < height; y++){
            const pixel = {
                r: pixels.get(x, y, 0),
                g: pixels.get(x, y, 1),
                b: pixels.get(x, y, 2)
            };
            if (pixel.b == 255 && pixel.r == 0 && pixel.g == 0) {
                expectedPath[pointId(x, y)] = {
                    x,
                    y
                };
            }
            if (pixel.b == 0 && pixel.r == 255 && pixel.g == 0) {
                start = {
                    x,
                    y
                };
            }
            if (pixel.b == 0 && pixel.r == 0 && pixel.g == 255) {
                stop = {
                    x,
                    y
                };
            }
            weightGraph[x][y] = averageColor(pixel.r, pixel.g, pixel.b);
        }
    }
    return {
        graph: weightGraph,
        expectedPath,
        start,
        stop
    };
}
export function verifyPath(resultingPath, graph) {
    // If the last path point is the end, pop it from the path to avoid failing
    // comparing the result path and the expected path
    if (pointEquals(resultingPath[resultingPath.length - 1], graph.stop)) {
        resultingPath.pop();
    }
    const expectedPointsCopy = Object.assign({}, graph.expectedPath);
    for (const point of resultingPath){
        const id = pointId(point.x, point.y);
        const pointIsExpected = expectedPointsCopy[id];
        if (!pointIsExpected) {
            assert.fail(`Point not expected ${id}`);
        } else {
            delete expectedPointsCopy[id];
        }
    }
    const expectedPointsLeft = Object.values(expectedPointsCopy).length;
    assert.equal(expectedPointsLeft, 0, "All expected points not visited by resulting path");
}
async function getPixelsAsync(path) {
    return new Promise((resolve, reject)=>{
        getPixels(path, (error, pixels)=>{
            if (!!error) {
                reject(error);
            } else {
                resolve(pixels);
            }
        });
    });
}
function pointId(x, y) {
    return `x${x}y${y}`;
}
function averageColor(r, g, b) {
    return (r + g + b) / 3;
}

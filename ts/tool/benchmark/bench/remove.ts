import { logTable, MiniBench } from "../miniBench.js";
import { SparseSet } from "../../../src/common/structure/sparseSet.js";
import { createArray, createMap, createSparseSet, ListItem } from "./util.js";

const iterations = Number.parseInt(process.argv[2]);
const maxSize = Number.parseInt(process.argv[3]);
console.log("Remove test", iterations, maxSize);
const removeBench = new MiniBench("remove", iterations);
removeBench.add({
    setup: () => {
        return {
            index: Math.floor(Math.random() * maxSize),
            items: createArray(maxSize),
        };
    },
    run: (data: any) => {
        const newList = data.items.filter((item) => item.foo != data.index);
    },
    name: "Remove with filter",
});
removeBench.add({
    setup: () => {
        return {
            index: Math.floor(Math.random() * maxSize),
            items: createMap(maxSize),
        };
    },
    run: (data: any) => {
        data.items.delete(data.index);
    },
    name: "Remove with map",
});
removeBench.add({
    setup: () => {
        return {
            items: createSparseSet(maxSize),
            index: Math.floor(Math.random() * maxSize),
        };
    },
    run: (data: any) => {
        data.items.delete(data.index);
    },
    name: "Remove with sparse set",
});

const benchResult = removeBench.run();
logTable(benchResult);

import { logTable, MiniBench } from "../miniBench.js";
import { ReadableSet } from "../../../src/common/structure/sparseSet.js";
import { createArray, createMap, createSparseSet, ListItem } from "./util.js";

const iterations = Number.parseInt(process.argv[2]);
const maxSize = Number.parseInt(process.argv[3]);
console.log("Remove test", iterations, maxSize);
const removeBench = new MiniBench("update", iterations);

class TestClass {
    constructor(private adder: number) {}
    calculate(iterator: Iterable<ListItem>) {
        for (const item of iterator) {
            const newValue = this.adder + item.foo;
        }
    }
}

class SecondTestClass {
    constructor(private adder: number) {}
    calculate(value: ReadableSet<{ id: number; foo: number }>) {
        for (let i = 0; i < value.size; i++) {
            const element = value.elementAt(i);
            const newValue = this.adder + element.foo;
        }
    }
}

const testClassInstance = new TestClass(2);
const secondClassInstance = new SecondTestClass(2);
const listOfItems = createArray(maxSize);
const mapOfItems = createMap(maxSize);
const spareSetOfItem = createSparseSet(maxSize);
const mapOfItemsIterator = mapOfItems.values();

removeBench.add({
    run: () => {
        for (const item of listOfItems) {
            const newNumber = item.foo + 2;
        }
    },
    name: "Array - for of",
});

removeBench.add({
    run: () => {
        for (let i = 0; i < listOfItems.length; i++) {
            const element = listOfItems[i];
            const newNumber = element.foo + 2;
        }
    },
    name: "Array - for",
});
removeBench.add({
    run: () => {
        for (const item of mapOfItems) {
            const newNumber = item[1].foo + 2;
        }
    },
    name: "For of map",
});
removeBench.add({
    run: () => {
        for (const item of mapOfItems.values()) {
            const newNumber = item.foo + 2;
        }
    },
    name: "For of map.values()",
});
removeBench.add({
    run: () => {
        testClassInstance.calculate(mapOfItems.values());
    },
    name: "For of map.values() with func",
});
removeBench.add({
    run: () => {
        for (let i = 0; i < spareSetOfItem.size; i++) {
            let item = spareSetOfItem.dense[i];
            const newNumber = item.foo + 2;
        }
    },
    name: "Sparse set",
});
removeBench.add({
    run: () => {
        secondClassInstance.calculate(spareSetOfItem);
    },
    name: "Sparse set - withFunc",
});
const benchResult = removeBench.run();
logTable(benchResult);

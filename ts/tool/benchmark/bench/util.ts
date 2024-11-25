import { SparseSet } from "../../../src/common/structure/sparseSet.js";

export type ListItem = { foo: number };
export function createArray(max: number): ListItem[] {
    const returnvalue: { foo: number }[] = [];
    let currentValue = 0;
    for (let i = 0; i < max; i++) {
        currentValue += 1;
        returnvalue.push({
            foo: currentValue,
        });
    }

    return returnvalue;
}

export function createMap(max: number): Map<number, ListItem> {
    const returnvalue: Map<number, ListItem> = new Map();
    let currentValue = 0;
    for (let i = 0; i < max; i++) {
        currentValue += 1;
        returnvalue.set(currentValue, { foo: currentValue });
    }

    return returnvalue;
}

export function createSparseSet(
    max: number,
): SparseSet<{ id: number; foo: number }> {
    const returnvalue = new SparseSet<{ id: number; foo: number }>();
    let currentValue = 0;
    for (let i = 0; i < max; i++) {
        currentValue += 1;
        returnvalue.add({ foo: currentValue, id: currentValue });
    }

    return returnvalue;
}

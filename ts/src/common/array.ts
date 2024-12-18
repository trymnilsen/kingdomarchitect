/**
 * Returns a random entry in an array
 * @param array the array to return from
 * @returns the randomly selected item
 */
export function randomEntry<T>(array: T[]): T {
    //TODO: return early if array is empty
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

/**
 * Sort the array based on the values provided by the sort function.
 * The values provided will use the default array sorting for sorting the
 * the items in the initial array
 * @param array the array of items to sort
 * @param sortFn a function for
 */
export function sortBy<T>(array: T[], sortFn: (item: T) => number): T[] {
    return array
        .map((item) => {
            return {
                sortKey: sortFn(item),
                item: item,
            };
        })
        .sort((a, b) => {
            return b.sortKey - a.sortKey;
        })
        .map((item) => {
            return item.item;
        });
}

/**
 * Picks a random item for the list based on the weights supplied.
 * [a,b] with weights [1,2] makes `b` twice as likely to be picked as `a`.
 * Will throw an error if the items and weights array are not the same size.
 * @param items the items to pick from. Cannot be empty.
 * @param weights the weights if items to pick. A weight of 0 means not
 * possible to pick and will be filtered out
 * @returns the selected "random" entry.
 */
export function weightedRandomEntry<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
        throw new Error("Items and weights must be of the same size");
    }

    if (!items.length) {
        throw new Error("Items must not be empty");
    }

    if (items.length == 1) {
        return items[0];
    }

    // Filter out items that have a weight of 0 as this will mess with
    // the comulative weights
    const filteredItems = items.filter((_item, index) => {
        return weights[index] != 0;
    });
    const filteredWeights = weights.filter((weight) => {
        return weight != 0;
    });
    // Preparing the cumulative weights array.
    // For example:
    // - weights = [1, 4, 3]
    // - cumulativeWeights = [1, 5, 8]
    const cumulativeWeights: number[] = [];
    for (let i = 0; i < filteredWeights.length; i += 1) {
        cumulativeWeights[i] =
            filteredWeights[i] + (cumulativeWeights[i - 1] || 0);
    }

    // Getting the random number in a range of [0...sum(weights)]
    // For example:
    // - weights = [1, 4, 3]
    // - maxCumulativeWeight = 8
    // - range for the random number is [0...8]
    const maxCumulativeWeight = cumulativeWeights[cumulativeWeights.length - 1];
    const randomNumber = maxCumulativeWeight * Math.random();

    // Picking the random item based on its weight.
    // The items with higher weight will be picked more often.
    for (let itemIndex = 0; itemIndex < filteredItems.length; itemIndex += 1) {
        if (cumulativeWeights[itemIndex] >= randomNumber) {
            return filteredItems[itemIndex];
        }
    }

    return filteredItems[0];
}

export function removeItem<T>(array: T[], item: T): boolean {
    const indexOfItem = array.indexOf(item);
    if (indexOfItem >= 0) {
        array.splice(indexOfItem, 1);
        return true;
    } else {
        return false;
    }
}

export function pushMapEntry<T>(
    collection: Record<string, T[]>,
    key: string,
    item: T,
) {
    if (collection[key]) {
        collection[key].push(item);
    } else {
        collection[key] = [item];
    }
}

export function shuffleItems<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Loops over the array, applying the maping function to the values.
 * Will return the first non null value provided by the mapper
 * @param array
 * @returns the first value mapped or null if none
 */
export function firstMap<T, R>(
    array: T[],
    mapper: (value: T) => R | null,
): R | null {
    for (let i = 0; i < array.length; i++) {
        const element = array[i];
        const mappingResult = mapper(element);
        if (!!mappingResult) {
            return mappingResult;
        }
    }

    return null;
}

/**
 * Loop over an array and generate a map out of the values using the key
 * selector function. In the event of non unique keys the last item will be
 * set as the value for the key
 * @param array the array to turn into an object
 * @param keySelector a function to create the key for the array item
 * @returns a map of items with a key and the array items
 */
export function arrayToOject<T>(
    array: T[],
    keySelector: (value: T) => string,
): {
    [id: string]: T;
} {
    const map = {};
    for (let i = 0; i < array.length; i++) {
        const element = array[i];
        const key = keySelector(element);
        map[key] = element;
    }

    return map;
}

export function forEachOf<T>(items: T | T[], onEach: (item: T) => void) {
    if (Array.isArray(items)) {
        for (const component of items) {
            onEach(component);
        }
    } else {
        onEach(items);
    }
}

declare global {
    interface Array<T> {
        /**
         * Returns the first element of the array
         * @throws if the size is 0
         */
        first(): T;
        /**
         * Returns the first element of the array
         * @throws if the size is 0
         */
        last(): T;
    }
}

Array.prototype.first = function () {
    if (this.length < 1) {
        throw new Error("Array has no first element");
    }

    return this[0];
};

Array.prototype.last = function () {
    if (this.length < 1) {
        throw new Error("Array has no last element");
    }

    return this[0];
};

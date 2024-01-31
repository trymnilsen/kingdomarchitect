/**
 * Returns a random entry in an array
 * @param array the array to return from
 * @returns the randomly selected item
 */
export function randomEntry<T>(array: T[]): T {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

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

    // Preparing the cumulative weights array.
    // For example:
    // - weights = [1, 4, 3]
    // - cumulativeWeights = [1, 5, 8]
    const cumulativeWeights: number[] = [];
    for (let i = 0; i < weights.length; i += 1) {
        cumulativeWeights[i] = weights[i] + (cumulativeWeights[i - 1] || 0);
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
    for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
        if (cumulativeWeights[itemIndex] >= randomNumber) {
            return items[itemIndex];
        }
    }

    return items[0];
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

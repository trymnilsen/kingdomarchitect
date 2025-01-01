export interface MiniBenchTest<T = unknown> {
    setup?: () => T;
    run: (data: T) => void;
    name: string;
}

export interface TestResult {
    name: string;
    stats: DurationStats;
}

export interface DurationStats {
    average: string;
    median: string;
    percentageDurationsBelow: { [key: string]: string };
}

function calculateStatisticsWithPercentiles(
    durations: bigint[],
): DurationStats {
    if (durations.length === 0) {
        throw new Error("The array of durations is empty.");
    }

    // Sort data (BigInt supports standard comparison)
    const sortedData = [...durations].sort((a, b) =>
        a < b ? -1 : a > b ? 1 : 0,
    );

    const total = BigInt(durations.length);
    // Calculate mean
    const sum = sortedData.reduce((acc, num) => acc + num, 0n);
    const mean = sum / total;

    // Calculate median
    let median: BigInt;
    const mid = Number(total / 2n);
    if (total % 2n === 0n) {
        median = (sortedData[mid - 1] + sortedData[mid]) / 2n;
    } else {
        median = sortedData[mid];
    }

    // Calculate percentiles
    const percentiles: Record<string, string> = {};
    [25, 50, 75, 95, 99, 100].forEach((percentile) => {
        const index = Math.ceil((Number(percentile) / 100) * Number(total)) - 1;
        percentiles[percentile] = sortedData[Math.max(0, index)].toString();
    });

    return {
        average: mean.toString(),
        median: median.toString(),
        percentageDurationsBelow: percentiles,
    };
}

type TableData = Record<string, string[]>;

function generateTable(data: TableData): void {
    // Get column names and rows
    const columns = Object.keys(data);
    const rows = Math.max(...Object.values(data).map((col) => col.length));

    // Calculate column widths based on the longest content in each column
    const columnWidths = columns.map((col) =>
        Math.max(col.length, ...data[col].map((row) => row.length)),
    );

    // Helper function to pad strings
    const padString = (str: string, length: number) => str.padEnd(length, " ");

    // Generate and print header
    const header = columns
        .map((col, i) => padString(col, columnWidths[i]))
        .join(" | ");
    console.log(header);
    console.log("-".repeat(header.length));

    // Generate and print rows
    for (let i = 0; i < rows; i++) {
        const row = columns
            .map((col, colIndex) =>
                padString(data[col][i] || "", columnWidths[colIndex]),
            )
            .join(" | ");
        console.log(row);
    }
}

export class MiniBench<T = unknown> {
    private tests: MiniBenchTest<T>[] = [];
    constructor(
        private name: string,
        private samples: number = 1000,
        private sampleStep: number | undefined = samples / 10,
    ) {}

    add(entry: MiniBenchTest<T>) {
        this.tests.push(entry);
    }

    run(): TestResult[] {
        console.log("Starting warmup");
        //Run a warmout round
        for (const test of this.tests) {
            console.log("Warming up: ", test.name);
            let data: any;
            if (!!test.setup) {
                data = test.setup();
            }
            test.run(data);
        }

        const testResults: TestResult[] = [];
        for (let i = 0; i < this.tests.length; i++) {
            const test = this.tests[i];
            const timings: bigint[] = [];
            console.log(`Running ${test.name} with ${this.samples} samples`);
            for (let j = 0; j < this.samples; j++) {
                let data: any;
                if (!!test.setup) {
                    data = test.setup();
                }
                const start = process.hrtime.bigint();
                test.run(data);
                const end = process.hrtime.bigint();
                timings.push(end - start);
                if (this.sampleStep && j % this.sampleStep === 0) {
                    console.log(`Samples run: ${j}`);
                }
            }
            const testResult = calculateStatisticsWithPercentiles(timings);
            testResults.push({
                name: test.name,
                stats: testResult,
            });
        }

        return testResults;
    }
}

export function logTable(results: TestResult[]) {
    const table: { [id: string]: string[] } = {};
    table["name"] = results.map((item) => item.name);
    table["avg"] = results.map((item) => item.stats.average);
    table["median"] = results.map((item) => item.stats.median);
    table["percentage"] = results.map((item) =>
        Object.entries(item.stats.percentageDurationsBelow)
            .map((entry) => `${entry[0]}: ${entry[1]}`)
            .join(", "),
    );

    generateTable(table);
}

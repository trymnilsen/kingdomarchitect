import { Transform } from "node:stream";

const customReporter = new Transform({
    writableObjectMode: true,
    transform(event, encoding, callback) {
        switch (event.type) {
            case "test:dequeue":
                callback(null, null);
                break;
            case "test:enqueue":
                callback(null, null);
                break;
            case "test:watch:drained":
                callback(null, null);
                break;
            case "test:start":
                callback(null, null);
                break;
            case "test:pass":
                callback(null, `test ${event.data.name} passed\n`);
                break;
            case "test:fail":
                callback(
                    null,
                    `test ${event.data.name} failed ${JSON.stringify(
                        event.data,
                    )}\n`,
                );
                break;
            case "test:plan":
                callback(null, null);
                break;
            case "test:diagnostic":
            case "test:stderr":
            case "test:stdout":
                callback(null, event.data.message);
                break;
            case "test:coverage": {
                const { totalLineCount } = event.data.summary.totals;
                callback(null, `total line count: ${totalLineCount}\n`);
                break;
            }
        }
    },
});

export default customReporter;

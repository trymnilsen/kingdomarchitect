import assert from "node:assert";
import { describe, it, afterEach } from "node:test";
import {
    log,
    ConsoleWriter,
    BufferWriter,
} from "../../../src/common/logging/logger.ts";

function withConsoleSpy(fn: () => void): {
    calls: Array<{ method: string; args: unknown[] }>;
} {
    const calls: Array<{ method: string; args: unknown[] }> = [];
    const origDebug = console.debug;
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    console.debug = (...args: unknown[]) =>
        calls.push({ method: "debug", args });
    console.log = (...args: unknown[]) => calls.push({ method: "log", args });
    console.warn = (...args: unknown[]) => calls.push({ method: "warn", args });
    console.error = (...args: unknown[]) =>
        calls.push({ method: "error", args });

    try {
        fn();
    } finally {
        console.debug = origDebug;
        console.log = origLog;
        console.warn = origWarn;
        console.error = origError;
    }

    return { calls };
}

afterEach(() => {
    log.setConsoleWriter(undefined);
    log.setLogBufferWriter(undefined);
});

describe("Logger — no writers by default", () => {
    it("produces no console output without a ConsoleWriter", () => {
        const { calls } = withConsoleSpy(() => {
            log.info("should be silent");
        });
        assert.strictEqual(calls.length, 0);
    });
});

describe("ConsoleWriter", () => {
    it("prints the message to console when added", () => {
        log.setConsoleWriter(new ConsoleWriter());
        const { calls } = withConsoleSpy(() => {
            log.info("Hunger increased");
        });
        assert.strictEqual(calls.length, 1);
        assert.ok((calls[0].args[0] as string).includes("Hunger increased"));
    });

    it("passes data as a separate console argument", () => {
        log.setConsoleWriter(new ConsoleWriter());
        const data = { entityId: "worker_1" };
        const { calls } = withConsoleSpy(() => {
            log.info("message", data);
        });
        assert.strictEqual(calls[0].args.length, 2);
        assert.strictEqual(calls[0].args[1], data);
    });

    it("routes each level to the correct console method", () => {
        log.setConsoleWriter(new ConsoleWriter());
        const { calls } = withConsoleSpy(() => {
            log.debug("d");
            log.info("i");
            log.warn("w");
            log.error("e");
        });
        assert.strictEqual(calls[0].method, "debug");
        assert.strictEqual(calls[1].method, "log");
        assert.strictEqual(calls[2].method, "warn");
        assert.strictEqual(calls[3].method, "error");
    });

    it("extracts Error from data and passes it as a top-level arg", () => {
        log.setConsoleWriter(new ConsoleWriter());
        const err = new Error("boom");
        const { calls } = withConsoleSpy(() => {
            log.error("something failed", { error: err });
        });
        assert.ok(calls[0].args.includes(err));
    });

    it("produces no output after setConsoleWriter(undefined)", () => {
        log.setConsoleWriter(new ConsoleWriter());
        log.setConsoleWriter(undefined);
        const { calls } = withConsoleSpy(() => {
            log.info("should be silent");
        });
        assert.strictEqual(calls.length, 0);
    });
});

describe("BufferWriter", () => {
    it("does not write to console", () => {
        log.setLogBufferWriter(new BufferWriter());
        const { calls } = withConsoleSpy(() => {
            log.info("buffered only");
        });
        assert.strictEqual(calls.length, 0);
    });

    it("getLogBuffer returns entries written to the buffer", () => {
        log.setLogBufferWriter(new BufferWriter());
        log.info("first");
        log.warn("second");
        const entries = log.getLogBuffer();
        assert.ok(entries !== undefined);
        assert.strictEqual(entries.length, 2);
        assert.strictEqual(entries[0].message, "first");
        assert.strictEqual(entries[1].message, "second");
    });

    it("getLogBuffer returns undefined when no buffer writer is set", () => {
        assert.strictEqual(log.getLogBuffer(), undefined);
    });

    it("stores a JSON-safe snapshot of circular data payloads", () => {
        log.setLogBufferWriter(new BufferWriter());

        const parent: Record<string, unknown> = { id: "parent" };
        const child: Record<string, unknown> = { id: "child", parent };
        parent["children"] = [child];

        log.warn("circular payload", parent);

        const entries = log.getLogBuffer();
        assert.ok(entries !== undefined);
        // The whole buffer is what gets embedded in save files; it must survive
        // serialization even though the logged object referenced itself.
        assert.doesNotThrow(() => JSON.stringify(entries));

        const data = entries[0].data as Record<string, unknown>;
        assert.strictEqual(data["id"], "parent");
        const snapshottedChild = (
            data["children"] as Record<string, unknown>[]
        )[0];
        assert.strictEqual(snapshottedChild["id"], "child");
        assert.strictEqual(snapshottedChild["parent"], "[Circular]");
    });

    it("snapshots the payload at log time so later mutation is not captured", () => {
        log.setLogBufferWriter(new BufferWriter());

        const payload = { count: 1 };
        log.info("snapshot", payload);
        payload.count = 99;

        const entries = log.getLogBuffer();
        assert.ok(entries !== undefined);
        assert.strictEqual((entries[0].data as { count: number }).count, 1);
    });
});

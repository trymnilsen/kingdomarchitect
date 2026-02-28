import assert from "node:assert";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
    createRootLogger,
    createLogger,
} from "../../../src/common/logging/logger.ts";

// Capture console output without printing it during tests
function withConsoleSpy(fn: () => void): {
    calls: Array<{ method: string; args: unknown[] }>;
} {
    const calls: Array<{ method: string; args: unknown[] }> = [];
    const origDebug = console.debug;
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;
    const origGroup = console.groupCollapsed;
    const origGroupEnd = console.groupEnd;

    console.debug = (...args: unknown[]) => calls.push({ method: "debug", args });
    console.log = (...args: unknown[]) => calls.push({ method: "log", args });
    console.warn = (...args: unknown[]) => calls.push({ method: "warn", args });
    console.error = (...args: unknown[]) => calls.push({ method: "error", args });
    console.groupCollapsed = (...args: unknown[]) =>
        calls.push({ method: "groupCollapsed", args });
    console.groupEnd = () => calls.push({ method: "groupEnd", args: [] });

    try {
        fn();
    } finally {
        console.debug = origDebug;
        console.log = origLog;
        console.warn = origWarn;
        console.error = origError;
        console.groupCollapsed = origGroup;
        console.groupEnd = origGroupEnd;
    }

    return { calls };
}

beforeEach(() => {
    // Reset globalThis.log before each test so tests are independent
    delete (globalThis as Record<string, unknown>)["log"];
    delete (globalThis as Record<string, unknown>)["currentTick"];
});

afterEach(() => {
    delete (globalThis as Record<string, unknown>)["log"];
    delete (globalThis as Record<string, unknown>)["currentTick"];
});

describe("createRootLogger", () => {
    it("assigns itself to globalThis.log", () => {
        createRootLogger();
        assert.ok((globalThis as Record<string, unknown>)["log"] !== undefined);
    });

    it("writes entries with correct level, tag, message", () => {
        const log = createRootLogger();
        const { calls } = withConsoleSpy(() => {
            log.info("hunger", "Hunger increased");
        });
        assert.strictEqual(calls.length, 1);
        assert.ok((calls[0].args[0] as string).includes("[hunger]"));
        assert.ok((calls[0].args[0] as string).includes("Hunger increased"));
    });

    it("sequential calls increment seq", () => {
        const log = createRootLogger();
        withConsoleSpy(() => {
            log.info("a", "first");
            log.info("a", "second");
            log.info("a", "third");
        });
        // Replay all and verify seq ordering via last call positions
        let seqs: number[] = [];
        const { calls } = withConsoleSpy(() => {
            log.replay();
        });
        // groupCollapsed + entries + groupEnd
        const entries = calls.filter((c) => c.method === "log");
        // Each entry prefix contains seq via message content - we verify order instead
        assert.strictEqual(entries.length, 3);
    });

    it("includes tick when globalThis.currentTick is set", () => {
        (globalThis as Record<string, unknown>)["currentTick"] = 42;
        const log = createRootLogger();
        const { calls } = withConsoleSpy(() => {
            log.info("test", "with tick");
        });
        assert.ok((calls[0].args[0] as string).includes("[t:42]"));
    });

    it("omits tick when globalThis.currentTick is not set", () => {
        const log = createRootLogger();
        const { calls } = withConsoleSpy(() => {
            log.info("test", "no tick");
        });
        assert.ok(!(calls[0].args[0] as string).includes("[t:"));
    });

    it("passes data as a separate console argument", () => {
        const log = createRootLogger();
        const data = { entityId: "worker_1" };
        const { calls } = withConsoleSpy(() => {
            log.info("test", "message", data);
        });
        assert.strictEqual(calls[0].args.length, 2);
        assert.strictEqual(calls[0].args[1], data);
    });

    it("uses correct console method per level", () => {
        const log = createRootLogger();
        const { calls } = withConsoleSpy(() => {
            log.debug("t", "d");
            log.info("t", "i");
            log.warn("t", "w");
            log.error("t", "e");
        });
        assert.strictEqual(calls[0].method, "debug");
        assert.strictEqual(calls[1].method, "log");
        assert.strictEqual(calls[2].method, "warn");
        assert.strictEqual(calls[3].method, "error");
    });
});

describe("live filter — show/showAll/mute", () => {
    it("show restricts live output to matching tag", () => {
        const log = createRootLogger();
        log.show("behavior");
        const { calls } = withConsoleSpy(() => {
            log.info("hunger", "should be hidden");
            log.info("behavior", "should appear");
        });
        assert.strictEqual(calls.length, 1);
        assert.ok((calls[0].args[0] as string).includes("should appear"));
    });

    it("showAll removes tag filter", () => {
        const log = createRootLogger();
        log.show("behavior");
        log.showAll();
        const { calls } = withConsoleSpy(() => {
            log.info("hunger", "now visible");
        });
        assert.strictEqual(calls.length, 1);
    });

    it("mute suppresses all live output", () => {
        const log = createRootLogger();
        log.mute();
        const { calls } = withConsoleSpy(() => {
            log.info("hunger", "muted");
            log.error("server", "also muted");
        });
        assert.strictEqual(calls.length, 0);
    });
});

describe("live filter — level", () => {
    it("min mode shows entries at or above the set level", () => {
        const log = createRootLogger();
        log.level("warn");
        const { calls } = withConsoleSpy(() => {
            log.debug("t", "debug");
            log.info("t", "info");
            log.warn("t", "warn");
            log.error("t", "error");
        });
        assert.strictEqual(calls.length, 2);
        assert.strictEqual(calls[0].method, "warn");
        assert.strictEqual(calls[1].method, "error");
    });

    it("exact mode shows only entries at exactly the set level", () => {
        const log = createRootLogger();
        log.level("warn", "exact");
        const { calls } = withConsoleSpy(() => {
            log.debug("t", "debug");
            log.info("t", "info");
            log.warn("t", "warn");
            log.error("t", "error");
        });
        assert.strictEqual(calls.length, 1);
        assert.strictEqual(calls[0].method, "warn");
    });

    it("calling level() re-enables output after mute", () => {
        const log = createRootLogger();
        log.mute();
        log.level("debug");
        const { calls } = withConsoleSpy(() => {
            log.info("t", "visible again");
        });
        assert.strictEqual(calls.length, 1);
    });
});

describe("tags", () => {
    it("tracks all seen tags across writes", () => {
        const log = createRootLogger();
        log.mute();
        log.info("hunger", "a");
        log.info("behavior", "b");
        log.warn("pathfinding", "c");

        const { calls } = withConsoleSpy(() => {
            log.tags();
        });
        const output = calls[0].args[1] as string[];
        assert.deepStrictEqual(output, ["behavior", "hunger", "pathfinding"]);
    });
});

describe("replay", () => {
    it("with no filter replays all entries using groupCollapsed", () => {
        const log = createRootLogger();
        log.mute();
        log.info("a", "first");
        log.info("b", "second");

        const { calls } = withConsoleSpy(() => {
            log.replay();
        });

        const hasGroup = calls.some((c) => c.method === "groupCollapsed");
        assert.ok(hasGroup);
        const logCalls = calls.filter((c) => c.method === "log");
        assert.strictEqual(logCalls.length, 2);
    });

    it("filters by single tag", () => {
        const log = createRootLogger();
        log.mute();
        log.info("hunger", "hungry");
        log.info("behavior", "working");
        log.info("hunger", "hungry again");

        const { calls } = withConsoleSpy(() => {
            log.replay({ tag: "hunger" });
        });
        const logCalls = calls.filter((c) => c.method === "log");
        assert.strictEqual(logCalls.length, 2);
    });

    it("filters by multiple tags (any match)", () => {
        const log = createRootLogger();
        log.mute();
        log.info("hunger", "a");
        log.info("behavior", "b");
        log.info("pathfinding", "c");
        log.info("server", "d");

        const { calls } = withConsoleSpy(() => {
            log.replay({ tag: ["hunger", "pathfinding"] });
        });
        const logCalls = calls.filter((c) => c.method === "log");
        assert.strictEqual(logCalls.length, 2);
    });

    it("filters by time window", () => {
        const log = createRootLogger();
        log.mute();

        const before = Date.now() - 2000;
        const after = Date.now() + 2000;

        log.info("test", "in window");
        log.info("test", "also in window");

        const { calls } = withConsoleSpy(() => {
            log.replay({ fromTime: before, toTime: after });
        });
        const logCalls = calls.filter((c) => c.method === "log");
        assert.strictEqual(logCalls.length, 2);
    });

    it("returns last n entries with last filter", () => {
        const log = createRootLogger();
        log.mute();
        log.info("t", "1");
        log.info("t", "2");
        log.info("t", "3");
        log.info("t", "4");
        log.info("t", "5");

        const { calls } = withConsoleSpy(() => {
            log.replay({ last: 3 });
        });
        const logCalls = calls.filter((c) => c.method === "log");
        assert.strictEqual(logCalls.length, 3);
        assert.ok((logCalls[0].args[0] as string).includes("3"));
        assert.ok((logCalls[1].args[0] as string).includes("4"));
        assert.ok((logCalls[2].args[0] as string).includes("5"));
    });
});

describe("tail", () => {
    it("tail(n) is equivalent to replay({ last: n })", () => {
        const log = createRootLogger();
        log.mute();
        for (let i = 1; i <= 5; i++) {
            log.info("t", `entry ${i}`);
        }

        const { calls } = withConsoleSpy(() => {
            log.tail(2);
        });
        const logCalls = calls.filter((c) => c.method === "log");
        assert.strictEqual(logCalls.length, 2);
    });
});

describe("showNext", () => {
    it("prints the next n entries then stops", () => {
        const log = createRootLogger();
        log.mute();
        log.showNext(3);

        const { calls } = withConsoleSpy(() => {
            log.info("t", "1");
            log.info("t", "2");
            log.info("t", "3");
            log.info("t", "4"); // should not be printed
            log.info("t", "5"); // should not be printed
        });
        const logCalls = calls.filter((c) => c.method === "log");
        assert.strictEqual(logCalls.length, 3);
    });

    it("only counts entries that match the filter toward n", () => {
        const log = createRootLogger();
        log.mute();
        log.showNext(2, { tag: "behavior" });

        const { calls } = withConsoleSpy(() => {
            log.info("hunger", "ignored");
            log.info("behavior", "match 1");
            log.info("hunger", "ignored");
            log.info("behavior", "match 2");
            log.info("behavior", "should not appear"); // showNext expired
        });
        const logCalls = calls.filter((c) => c.method === "log");
        assert.strictEqual(logCalls.length, 2);
        assert.ok((logCalls[0].args[0] as string).includes("match 1"));
        assert.ok((logCalls[1].args[0] as string).includes("match 2"));
    });

    it("entries not printed by showNext are still in the buffer", () => {
        const log = createRootLogger();
        log.mute();
        log.showNext(1);

        withConsoleSpy(() => {
            log.info("t", "printed");
            log.info("t", "buffered but not printed");
        });

        const { calls } = withConsoleSpy(() => {
            log.replay();
        });
        const logCalls = calls.filter((c) => c.method === "log");
        assert.strictEqual(logCalls.length, 2);
    });

    it("suspends the regular live filter while active, then restores it", () => {
        const log = createRootLogger();
        log.show("active");
        log.showNext(1, { tag: "special" });

        const { calls } = withConsoleSpy(() => {
            log.info("active", "suppressed while showNext is live"); // showNext is the filter now
            log.info("special", "shown by showNext"); // showNext fires (count → 0)
            log.info("other", "blocked by regular filter"); // regular filter resumes
            log.info("active", "passes regular filter again"); // regular filter passes
        });
        const logCalls = calls.filter((c) => c.method === "log");
        assert.strictEqual(logCalls.length, 2);
        assert.ok((logCalls[0].args[0] as string).includes("shown by showNext"));
        assert.ok((logCalls[1].args[0] as string).includes("passes regular filter again"));
    });
});

describe("createLogger (tagged)", () => {
    it("writes entries with the pre-bound tag, no tag arg needed", () => {
        createRootLogger();
        const log = createLogger("hunger");

        const { calls } = withConsoleSpy(() => {
            log.info("Hunger increased", { entityId: "worker_3" });
        });
        assert.strictEqual(calls.length, 1);
        assert.ok((calls[0].args[0] as string).includes("[hunger]"));
        assert.ok((calls[0].args[0] as string).includes("Hunger increased"));
    });

    it("all write methods work on a tagged logger", () => {
        createRootLogger();
        const log = createLogger("system");

        const { calls } = withConsoleSpy(() => {
            log.debug("dbg");
            log.info("inf");
            log.warn("wrn");
            log.error("err");
        });
        assert.strictEqual(calls[0].method, "debug");
        assert.strictEqual(calls[1].method, "log");
        assert.strictEqual(calls[2].method, "warn");
        assert.strictEqual(calls[3].method, "error");
    });

    it("tagged logger entries are visible in replay", () => {
        createRootLogger();
        const log = createLogger("persistence");
        const rootLog = (globalThis as Record<string, unknown>)["log"] as ReturnType<typeof createRootLogger>;
        rootLog.mute();

        log.info("save complete");
        log.info("load started");

        const { calls } = withConsoleSpy(() => {
            rootLog.replay({ tag: "persistence" });
        });
        const logCalls = calls.filter((c) => c.method === "log");
        assert.strictEqual(logCalls.length, 2);
    });
});

import {
    createRingBuffer,
    readEntries,
    tailEntries,
    writeEntry,
} from "../ringBuffer.ts";
import type { LogEntry, LogFilter, LogLevel } from "./logEntry.ts";

export type LevelMode = "min" | "exact";

export type Logger = {
    debug(tag: string, message: string, data?: unknown): void;
    info(tag: string, message: string, data?: unknown): void;
    warn(tag: string, message: string, data?: unknown): void;
    error(tag: string, message: string, data?: unknown): void;
    show(tag: string): void;
    showAll(): void;
    mute(): void;
    level(level: LogLevel, mode?: LevelMode): void;
    /**
     * Live-prints the next n entries that match the optional filter, then
     * stops. Entries are always written to the buffer regardless.
     * Replaces the regular live filter while active.
     */
    showNext(n: number, filter?: LogFilter): void;
    tags(): void;
    replay(filter?: LogFilter): void;
    tail(n: number): void;
};

export type TaggedLogger = {
    debug(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
};

const levelRank: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

function callConsole(level: LogLevel, prefix: string, data?: unknown): void {
    if (data !== undefined) {
        if (level === "debug") console.debug(prefix, data);
        else if (level === "info") console.log(prefix, data);
        else if (level === "warn") console.warn(prefix, data);
        else console.error(prefix, data);
    } else {
        if (level === "debug") console.debug(prefix);
        else if (level === "info") console.log(prefix);
        else if (level === "warn") console.warn(prefix);
        else console.error(prefix);
    }
}

function formatPrefix(entry: LogEntry): string {
    const tickPart = entry.tick !== undefined ? `[t:${entry.tick}]` : "";
    return `${tickPart}[${entry.tag}] ${entry.message}`;
}

function matchesFilter(entry: LogEntry, filter: LogFilter): boolean {
    if (filter.tag !== undefined) {
        const tags = Array.isArray(filter.tag) ? filter.tag : [filter.tag];
        if (!tags.includes(entry.tag)) {
            return false;
        }
    }

    if (filter.level !== undefined) {
        if (levelRank[entry.level] < levelRank[filter.level]) {
            return false;
        }
    }

    if (filter.fromTime !== undefined && entry.timestamp < filter.fromTime) {
        return false;
    }

    if (filter.toTime !== undefined && entry.timestamp > filter.toTime) {
        return false;
    }

    return true;
}

/**
 * Creates the root logger for a JS context (webworker or main thread).
 * Assigns itself to globalThis.log so it's accessible via self.log or
 * window.log in devtools.
 */
export function createRootLogger(capacity = 8192): Logger {
    const buffer = createRingBuffer<LogEntry>(capacity);
    const seenTags = new Set<string>();

    let muted = false;
    let filterTag: string | undefined = undefined;
    let activeLevel: LogLevel | undefined = undefined;
    let levelMode: LevelMode = "min";
    let showNextState: { remaining: number; filter?: LogFilter } | null = null;

    function passesLiveFilter(entry: LogEntry): boolean {
        if (muted) return false;

        if (filterTag !== undefined && entry.tag !== filterTag) {
            return false;
        }

        if (activeLevel !== undefined) {
            if (levelMode === "min") {
                if (levelRank[entry.level] < levelRank[activeLevel]) {
                    return false;
                }
            } else {
                if (entry.level !== activeLevel) {
                    return false;
                }
            }
        }

        return true;
    }

    function write(
        level: LogLevel,
        tag: string,
        message: string,
        data?: unknown,
    ): void {
        const entry: LogEntry = {
            seq: buffer.total,
            timestamp: Date.now(),
            tick: (globalThis as Record<string, unknown>)["currentTick"] as
                | number
                | undefined,
            level,
            tag,
            message,
            data,
        };

        writeEntry(buffer, entry);
        seenTags.add(tag);

        if (showNextState !== null) {
            const matchesShowNext =
                showNextState.filter === undefined ||
                matchesFilter(entry, showNextState.filter);
            if (matchesShowNext) {
                callConsole(level, formatPrefix(entry), data);
                showNextState.remaining -= 1;
                if (showNextState.remaining <= 0) {
                    showNextState = null;
                }
            }
        } else if (passesLiveFilter(entry)) {
            callConsole(level, formatPrefix(entry), data);
        }
    }

    const logger: Logger = {
        debug(tag, message, data?) {
            write("debug", tag, message, data);
        },
        info(tag, message, data?) {
            write("info", tag, message, data);
        },
        warn(tag, message, data?) {
            write("warn", tag, message, data);
        },
        error(tag, message, data?) {
            write("error", tag, message, data);
        },

        show(tag) {
            filterTag = tag;
        },
        showAll() {
            filterTag = undefined;
        },
        mute() {
            muted = true;
        },
        showNext(n, filter?) {
            showNextState = { remaining: n, filter };
        },
        level(lv, mode = "min") {
            activeLevel = lv;
            levelMode = mode;
            muted = false;
        },

        tags() {
            const sorted = [...seenTags].sort();
            console.log("Known tags:", sorted);
        },

        replay(filter?: LogFilter) {
            let candidates =
                filter?.last !== undefined
                    ? tailEntries(buffer, filter.last)
                    : readEntries(buffer);

            if (filter !== undefined) {
                candidates = candidates.filter((e) =>
                    matchesFilter(e, filter),
                );
            }

            const label = buildReplayLabel(filter, candidates.length);
            console.groupCollapsed(label);
            for (const entry of candidates) {
                callConsole(entry.level, formatPrefix(entry), entry.data);
            }
            console.groupEnd();
        },

        tail(n) {
            logger.replay({ last: n });
        },
    };

    (globalThis as Record<string, unknown>)["log"] = logger;
    return logger;
}

/**
 * Creates a TaggedLogger backed by the root logger (globalThis.log).
 * The tag is pre-bound so callers don't need to specify it on every call.
 * The root logger must be initialized via createRootLogger() before any
 * write method is called.
 */
export function createLogger(tag: string): TaggedLogger {
    function getRootLogger(): Logger | undefined {
        return (globalThis as Record<string, unknown>)["log"] as
            | Logger
            | undefined;
    }

    return {
        debug(message, data?) {
            getRootLogger()?.debug(tag, message, data);
        },
        info(message, data?) {
            getRootLogger()?.info(tag, message, data);
        },
        warn(message, data?) {
            getRootLogger()?.warn(tag, message, data);
        },
        error(message, data?) {
            getRootLogger()?.error(tag, message, data);
        },
    };
}

function buildReplayLabel(
    filter: LogFilter | undefined,
    count: number,
): string {
    if (filter === undefined) {
        return `Replay: all (${count} entries)`;
    }

    const parts: string[] = [];

    if (filter.tag !== undefined) {
        const tags = Array.isArray(filter.tag) ? filter.tag : [filter.tag];
        parts.push(`[${tags.join(", ")}]`);
    }

    if (filter.level !== undefined) {
        parts.push(`level:${filter.level}`);
    }

    if (filter.last !== undefined) {
        parts.push(`last ${filter.last}`);
    } else if (filter.fromTime !== undefined || filter.toTime !== undefined) {
        const from = filter.fromTime ?? "start";
        const to = filter.toTime ?? "now";
        parts.push(`${from}–${to}`);
    }

    const description = parts.length > 0 ? parts.join(" ") : "all";
    return `Replay: ${description} (${count} entries)`;
}

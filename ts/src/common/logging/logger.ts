import { createRingBuffer, writeEntry } from "../ringBuffer.ts";
import type { LogEntry, LogLevel } from "./logEntry.ts";

export type LogWriter = {
    write(entry: LogEntry): void;
};

function pickConsoleFn(level: LogLevel): (...args: unknown[]) => void {
    if (level === "debug") return console.debug;
    if (level === "info") return console.log;
    if (level === "warn") return console.warn;
    return console.error;
}

/**
 * Pulls an Error out of the data payload so we can pass it as a top-level
 * console argument. Browsers only render clickable, sourcemapped stack traces
 * when an Error instance is a direct console argument — wrapping it inside an
 * object (e.g. `{ error: err }`) reduces the stack to a plain string property.
 */
function extractError(data: unknown): Error | undefined {
    if (data instanceof Error) {
        return data;
    }
    if (typeof data === "object" && data !== null) {
        const obj = data as Record<string, unknown>;
        if (obj["error"] instanceof Error) return obj["error"];
        if (obj["err"] instanceof Error) return obj["err"];
        if (obj["cause"] instanceof Error) return obj["cause"];
    }
    return undefined;
}

export class ConsoleWriter implements LogWriter {
    write(entry: LogEntry): void {
        const consoleFn = pickConsoleFn(entry.level);
        const error = extractError(entry.data);

        if (error !== undefined && error === entry.data) {
            consoleFn(entry.message, error);
            return;
        }

        if (error !== undefined) {
            consoleFn(entry.message, entry.data, error);
            return;
        }

        if (entry.data !== undefined) {
            consoleFn(entry.message, entry.data);
            return;
        }

        consoleFn(entry.message);
    }
}

export class BufferWriter implements LogWriter {
    private buffer = createRingBuffer<LogEntry>(8192);

    write(entry: LogEntry): void {
        writeEntry(this.buffer, entry);
    }
}

export class Logger {
    private writers: LogWriter[] = [];
    private seq = 0;

    addWriter(writer: LogWriter): void {
        this.writers.push(writer);
    }

    removeWriter(writer: LogWriter): void {
        const index = this.writers.indexOf(writer);
        if (index !== -1) {
            this.writers.splice(index, 1);
        }
    }

    clearWriters(): void {
        this.writers = [];
    }

    debug(message: string, data?: unknown): void {
        this.write("debug", message, data);
    }

    info(message: string, data?: unknown): void {
        this.write("info", message, data);
    }

    warn(message: string, data?: unknown): void {
        this.write("warn", message, data);
    }

    error(message: string, data?: unknown): void {
        this.write("error", message, data);
    }

    private write(level: LogLevel, message: string, data?: unknown): void {
        if (this.writers.length === 0) return;
        const entry: LogEntry = {
            seq: this.seq++,
            timestamp: Date.now(),
            level,
            message,
            data,
        };
        for (const writer of this.writers) {
            writer.write(entry);
        }
    }
}

export const log = new Logger();

/**
 * Configures the singleton logger with a console writer and a ring buffer
 * writer. Call once at application startup.
 */
export function setupLogger(): void {
    log.addWriter(new ConsoleWriter());
    log.addWriter(new BufferWriter());
}

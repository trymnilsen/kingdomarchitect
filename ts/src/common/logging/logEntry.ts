export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
    seq: number;
    timestamp: number;
    tick?: number;
    level: LogLevel;
    tag: string;
    message: string;
    data?: unknown;
};

export type LogFilter = {
    tag?: string | string[];
    level?: LogLevel;
    fromTime?: number;
    toTime?: number;
    last?: number;
};

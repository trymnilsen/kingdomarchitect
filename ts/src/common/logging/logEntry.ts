export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
    seq: number;
    timestamp: number;
    level: LogLevel;
    message: string;
    data?: unknown;
};

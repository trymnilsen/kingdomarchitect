export interface Logger {
  info: (message: string) => void;
  error: (message: string) => void;
}
export function getLog(name: string): Logger {
    return {
      info: (message: string) => { console.info(`${Date.name} - ${name} - ${message}`); },
      error: (message: string) => { console.error(`${Date.name} - ${name} - ${message}`); }
    };
}

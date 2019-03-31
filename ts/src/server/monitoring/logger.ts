export interface Logger {
  info: (message: string) => void;
  error: (message: string) => void;
}

export function getLog(name: string): Logger {
    return {
      info: (message: string) => {
        if (process.env["NODE_ENV"] === "test") { return; }
        console.info(`${timestamp()} - ${name} - ${message}`);
      },
      error: (message: string) => { console.error(`${timestamp()} - ${name} - ${message}`); }
    };
}


function timestamp(): string {
  return new Date().toISOString();
}

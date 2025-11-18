type LogLevel = "info" | "warn" | "error" | "debug";

const levelColors: Record<LogLevel, string> = {
  info: "#1890ff",
  warn: "#faad14",
  error: "#ff4d4f",
  debug: "#52c41a",
};

export class Logger {
  constructor(private scope: string) {}

  private log(level: LogLevel, message: string, ...args: unknown[]) {
    const color = levelColors[level];
    // eslint-disable-next-line no-console
    console[level === "debug" ? "log" : level](
      `%c[${this.scope}]%c ${message}`,
      `color:${color};font-weight:bold;`,
      "color:inherit;",
      ...args,
    );
  }

  info(message: string, ...args: unknown[]) {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: unknown[]) {
    this.log("error", message, ...args);
  }

  debug(message: string, ...args: unknown[]) {
    this.log("debug", message, ...args);
  }
}

export const createLogger = (scope: string) => new Logger(scope);

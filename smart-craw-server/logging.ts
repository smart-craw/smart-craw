import winston from "winston";
import path from "path";
const errorLog = "error.log";
const logPath = process.env.DB_LOCATION
  ? path.join(process.env.DB_LOCATION, errorLog)
  : errorLog;
const logLevel = process.env.LOG_LEVEL || "info";
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.json(),
  defaultMeta: { service: "smart-craw" },
  transports: [
    //
    // - Write all logs with importance level of `error` or higher to `error.log`
    //   (i.e., error, fatal, but not other levels)
    //
    new winston.transports.File({ filename: logPath, level: "error" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

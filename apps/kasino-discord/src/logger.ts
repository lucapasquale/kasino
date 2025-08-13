import { OpenTelemetryTransportV3 } from "@opentelemetry/winston-transport";
import winston from "winston";

import { config } from "./config.js";

function createLogger() {
  if (config.environment !== "production") {
    return winston.createLogger({
      levels: winston.config.npm.levels,
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      transports: [new winston.transports.Console()],
    });
  }

  return winston.createLogger({
    levels: winston.config.npm.levels,
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [new winston.transports.Console(), new OpenTelemetryTransportV3()],
  });
}

export const logger = createLogger();

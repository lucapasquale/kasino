import "dotenv/config";
import { z } from "zod";

export const config = parseEnvVars();

function parseEnvVars() {
  const schema = z.object({
    environment: z.enum(["development", "production"]).default("development"),

    otlp: z.object({
      url: z.url().optional(),
    }),

    discord: z.object({
      token: z.string(),
    }),
  });

  const { error, data } = schema.safeParse({
    environment: process.env.ENVIRONMENT,

    otlp: {
      url: process.env.OTLP_URL,
    },

    discord: {
      token: process.env.DISCORD_TOKEN,
    },
  });

  if (error || !data) {
    throw new Error("Invalid environment config " + error.toString());
  }

  return data;
}

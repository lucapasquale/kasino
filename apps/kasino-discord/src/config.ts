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
      clientId: z.string(),
      testGuildId: z.string().optional(),
    }),

    youtube: z.object({
      apiKey: z.string(),
    }),
  });

  const { error, data } = schema.safeParse({
    environment: process.env.ENVIRONMENT,

    otlp: {
      url: process.env.OTLP_URL,
    },

    discord: {
      token: process.env.DISCORD_TOKEN,
      clientId: process.env.DISCORD_CLIENT_ID,
      testGuildId: process.env.DISCORD_TEST_GUILD_ID,
    },

    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY,
    },
  });

  if (error || !data) {
    throw new Error("Invalid environment config " + error.toString());
  }

  return data;
}

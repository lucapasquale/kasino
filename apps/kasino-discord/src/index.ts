import { Client, Events, GatewayIntentBits, REST } from "discord.js";

import { processInteraction, registerCommands } from "./commands/index.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

export const api = new REST().setToken(config.discord.token);

client.on(Events.ClientReady, async (readyClient) => {
  await registerCommands();

  logger.info(`Bot ${readyClient.user.tag} is ready!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  await processInteraction(interaction);
});

client.login(config.discord.token);

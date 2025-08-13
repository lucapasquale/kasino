import { CacheType, Interaction, REST, Routes } from "discord.js";

import { config } from "../config.js";
import { logger } from "../logger.js";
import { commands as pingCommands } from "./ping.js";

const ALL_COMMANDS = [...pingCommands];

const rest = new REST({ version: "10" }).setToken(config.discord.token);

export async function registerCommands() {
  await rest.put(Routes.applicationCommands(config.discord.clientId), { body: ALL_COMMANDS });
}

export async function processInteraction(interaction: Interaction<CacheType>) {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  logger.info(`Received interaction: ${interaction}`);

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  }
}

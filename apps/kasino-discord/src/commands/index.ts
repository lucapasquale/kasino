import {
  CacheType,
  ChatInputCommandInteraction,
  Interaction,
  InteractionResponse,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from "discord.js";

import { config } from "../config.js";
import { api } from "../index.js";
import { logger } from "../logger.js";
import { commands as musicCommands } from "./music.js";
import { commands as pingCommands } from "./ping.js";

export type Command = {
  definition: RESTPostAPIChatInputApplicationCommandsJSONBody;
  handle: (
    interaction: ChatInputCommandInteraction<CacheType>,
  ) => Promise<InteractionResponse<boolean>>;
};

const ALL_COMMANDS = [...pingCommands, ...musicCommands];

export async function registerCommands() {
  const cmdDefinitions = ALL_COMMANDS.map((cmd) => cmd.definition);

  if (config.environment === "development" && config.discord.testGuildId) {
    await api.put(
      Routes.applicationGuildCommands(config.discord.clientId, config.discord.testGuildId),
      { body: cmdDefinitions },
    );
  } else {
    await api.put(Routes.applicationCommands(config.discord.clientId), {
      body: cmdDefinitions,
    });
  }
}

export async function processInteraction(interaction: Interaction<CacheType>) {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  logger.info("Received interaction", {
    interaction: interaction.toString(),
    user: interaction.user.tag,
  });

  const command = ALL_COMMANDS.find((cmd) => cmd.definition.name === interaction.commandName);
  if (!command) {
    logger.error("Failed to find command");
    return interaction.reply("Unknown command");
  }

  try {
    await command.handle(interaction);
  } catch (err: unknown) {
    logger.error("Error handling command", {
      interaction: interaction.toString(),
      error: { message: (err as Error).message, stack: (err as Error).stack },
    });

    if (!interaction.replied) {
      interaction.reply("Command failed");
    }
  }
}

import { SlashCommandBuilder } from "discord.js";

import { Command } from "./index.js";

export const commands: Command[] = [
  {
    definition: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Responds with 'pong'")
      .toJSON(),

    handle: async (interaction) => {
      return interaction.reply("Pong!");
    },
  },
];

import { joinVoiceChannel } from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { client } from "../index.js";
import { MusicPlayer } from "../services/music-player.js";
import { Command } from "./index.js";

export const commands: Command[] = [
  {
    definition: new SlashCommandBuilder()
      .setName("play")
      .setDescription("Plays a song from YouTube.")
      .addStringOption((option) =>
        option.setName("url").setDescription("The song to play").setRequired(true),
      )
      .toJSON(),

    handle: handlePlay,
  },

  {
    definition: new SlashCommandBuilder()
      .setName("pause")
      .setDescription("Pauses current song.")
      .toJSON(),

    handle: handlePause,
  },

  {
    definition: new SlashCommandBuilder()
      .setName("stop")
      .setDescription("Stops current song.")
      .toJSON(),

    handle: handleStop,
  },
];

async function handlePlay(interaction: ChatInputCommandInteraction<CacheType>) {
  if (!interaction.guild) {
    return interaction.reply("Needs to be used inside a server");
  }

  const url = interaction.options.getString("url", true);
  if (!ytdl.validateURL(url)) {
    return interaction.reply("Invalid YouTube URL");
  }

  const guild = client.guilds.cache.get(interaction.guild.id);
  const member = await guild?.members.fetch(interaction.user.id);
  if (!member?.voice?.channelId) {
    return interaction.reply("You need to be in a voice channel to play music");
  }

  const connection = joinVoiceChannel({
    channelId: member.voice.channelId,
    guildId: member.voice.guild.id,
    adapterCreator: member.voice.guild.voiceAdapterCreator,
  });

  MusicPlayer.getInstance().addToQueue(connection, url);
  return interaction.reply("🎶 Now playing: " + url);
}

async function handlePause(interaction: ChatInputCommandInteraction<CacheType>) {
  if (!interaction.guild) {
    return interaction.reply("Needs to be used inside a server");
  }

  MusicPlayer.getInstance().pause();
  return interaction.reply("🎶 Paused");
}

async function handleStop(interaction: ChatInputCommandInteraction<CacheType>) {
  if (!interaction.guild) {
    return interaction.reply("Needs to be used inside a server");
  }

  MusicPlayer.getInstance().stop();
  return interaction.reply("🎶 Stopped");
}

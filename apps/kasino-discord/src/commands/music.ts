import { joinVoiceChannel } from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  MessageActionRowComponentBuilder,
  SlashCommandBuilder,
} from "discord.js";

import { client } from "../index.js";
import { MusicPlayer } from "../services/music-player.js";
import { YouTubeAPI } from "../services/youtube-api.js";
import { Command } from "./index.js";

export const commands: Command[] = [
  {
    definition: new SlashCommandBuilder()
      .setName("play")
      .setDescription("Plays a song from YouTube.")
      .addStringOption((option) =>
        option
          .setName("url")
          .setDescription("The YouTube music URL or search term")
          .setRequired(true),
      )
      .toJSON(),

    handle: handlePlay,
  },

  {
    definition: new SlashCommandBuilder()
      .setName("next")
      .setDescription("Goes to the next song.")
      .toJSON(),

    handle: async (interaction) => {
      if (!interaction.guild) {
        return interaction.reply("You need to be inside a server to use this command");
      }

      const nextUrl = MusicPlayer.getInstance().next();
      if (!nextUrl) {
        return interaction.reply("🎶 No more songs in the queue");
      }

      return interaction.reply({
        content: "🎶 Now playing: " + nextUrl,
        components: [buildMusicActions("pause")],
      });
    },
  },

  {
    definition: new SlashCommandBuilder()
      .setName("resume")
      .setDescription("Resumes current song.")
      .toJSON(),

    handle: async (interaction) => {
      if (!interaction.guild) {
        return interaction.reply("You need to be inside a server to use this command");
      }

      MusicPlayer.getInstance().resume();
      return interaction.reply({
        content: "🎶 Resumed",
        components: [buildMusicActions("pause")],
      });
    },
  },

  {
    definition: new SlashCommandBuilder()
      .setName("pause")
      .setDescription("Pauses current song.")
      .toJSON(),

    handle: async (interaction) => {
      if (!interaction.guild) {
        return interaction.reply("You need to be inside a server to use this command");
      }

      MusicPlayer.getInstance().pause();
      return interaction.reply({
        content: "🎶 Paused",
        components: [buildMusicActions("resume")],
      });
    },
  },

  {
    definition: new SlashCommandBuilder()
      .setName("stop")
      .setDescription("Stops current song.")
      .toJSON(),

    handle: async (interaction) => {
      if (!interaction.guild) {
        return interaction.reply("You need to be inside a server to use this command");
      }

      MusicPlayer.getInstance().stop();
      return interaction.reply("🎶 Stopped");
    },
  },
];

async function handlePlay(
  interaction: ChatInputCommandInteraction<CacheType> | ButtonInteraction<CacheType>,
) {
  if (!interaction.guild || interaction.isButton()) {
    return interaction.reply("You need to be inside a server to use this command");
  }

  const url = await getYoutubeUrl(interaction.options.getString("url", true));
  if (!url) {
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

  if (MusicPlayer.getInstance().getQueue().length === 0) {
    return interaction.reply({
      content: "🎶 Now playing: " + url,
      components: [buildMusicActions("pause")],
    });
  }

  return interaction.reply({
    content: "🎶 Added to queue: " + url,
    components: [buildMusicActions("pause")],
  });
}

async function getYoutubeUrl(term: string) {
  if (ytdl.validateURL(term)) {
    return term;
  }

  const searchResult = await YouTubeAPI.getInstance().searchVideos(term);

  const firstResult = searchResult[0]?.id?.videoId;
  return firstResult ? `https://www.youtube.com/watch?v=${firstResult}` : null;
}

function buildMusicActions(mainAction: "pause" | "resume") {
  const pauseButton = new ButtonBuilder()
    .setCustomId("pause")
    .setLabel("Pause")
    .setStyle(ButtonStyle.Secondary);

  const resumeButton = new ButtonBuilder()
    .setCustomId("resume")
    .setLabel("Resume")
    .setStyle(ButtonStyle.Success);

  const nextButton = new ButtonBuilder()
    .setCustomId("next")
    .setLabel("Next")
    .setStyle(ButtonStyle.Secondary);

  const stopButton = new ButtonBuilder()
    .setCustomId("stop")
    .setLabel("Stop")
    .setStyle(ButtonStyle.Danger);

  return new ActionRowBuilder().addComponents(
    mainAction === "pause" ? pauseButton : resumeButton,
    nextButton,
    stopButton,
  ) as ActionRowBuilder<MessageActionRowComponentBuilder>;
}

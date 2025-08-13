import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { client } from "../index.js";
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
];

async function handlePlay(interaction: ChatInputCommandInteraction<CacheType>) {
  if (!interaction.guild) {
    throw new Error("Needs to be used inside a server");
  }

  const url = interaction.options.getString("url", true);
  if (!url || !ytdl.validateURL(url)) {
    throw new Error("Invalid YouTube URL");
  }

  const guild = client.guilds.cache.get(interaction.guild.id);
  const member = await guild?.members.fetch(interaction.user.id);

  if (!member?.voice?.channelId) {
    throw new Error("You need to be in a voice channel to play music");
  }

  const connection = joinVoiceChannel({
    channelId: member.voice.channelId,
    guildId: member.voice.guild.id,
    adapterCreator: member.voice.guild.voiceAdapterCreator,
  });

  // Get stream from YouTube
  const stream = ytdl(url, {
    filter: "audioonly",
    quality: "highestaudio",
    highWaterMark: 1 << 25, // avoid buffering issues
  });

  const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
  player.play(createAudioResource(stream));
  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy(); // Leave after finishing
  });

  connection.subscribe(player);

  await interaction.reply("🎶 Now playing: " + url);
}

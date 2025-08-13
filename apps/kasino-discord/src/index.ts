import {
  NoSubscriberBehavior,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
} from "@discordjs/voice";
import { Client, GatewayIntentBits } from "discord.js";
import ytdl from "ytdl-core";

import { config } from "./config.js";
import { logger } from "./logger.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.on("ready", (readyClient) => {
  logger.info(`Logged in as ${readyClient.user.displayName}`);

  logger.info("Bot is ready!");
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!play")) {
    const args = message.content.split(" ");
    const url = args[1];

    if (!url || !ytdl.validateURL(url)) {
      return message.reply("Please provide a valid YouTube URL!");
    }

    const voiceChannel = message.member?.voice.channel;
    if (!voiceChannel) {
      return message.reply("You need to be in a voice channel to play music!");
    }

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });

      const stream = ytdl(url, { filter: "audioonly" });
      const resource = createAudioResource(stream);
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });

      player.play(resource);
      connection.subscribe(player);

      message.reply(`Now playing: ${url}`);

      player.on("error", (error) => {
        logger.error(
          `Error: ${error.message} with resource ${(error.resource.metadata as any).title}`,
        );
      });

      player.on("stateChange", (_oldState, newState) => {
        if (newState.status === "idle") {
          connection.destroy(); // Disconnect when playback finishes
        }
      });
    } catch (error) {
      logger.error(error);
      message.reply("There was an error trying to play the music.");
    }
  }
});

client.login(config.discord.token);

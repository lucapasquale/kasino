import {
  AudioPlayer,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnection,
  createAudioPlayer,
  createAudioResource,
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";

import { logger } from "../logger.js";

export class MusicPlayer {
  private connection: VoiceConnection | null;

  private player: AudioPlayer;
  private queue: string[] = [];

  private static instance: MusicPlayer;
  public static getInstance(): MusicPlayer {
    if (!MusicPlayer.instance) {
      MusicPlayer.instance = new MusicPlayer();
    }

    return MusicPlayer.instance;
  }

  constructor() {
    this.connection = null;

    this.player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Play },
    });

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.playNext();
    });
  }

  addToQueue(connection: VoiceConnection, url: string) {
    const isPlaying = this.connection && this.player.state.status === AudioPlayerStatus.Playing;

    if (!this.connection) {
      this.connection = connection;
      this.connection.subscribe(this.player);
    }

    logger.info("Adding url to queue", {
      url,
      queue: this.queue,
    });
    this.queue.push(url);

    if (!isPlaying) {
      this.playNext();
    }
  }

  getQueue() {
    return this.queue;
  }

  next() {
    return this.playNext();
  }

  pause() {
    logger.info("Player paused");
    this.player.pause();
  }

  stop() {
    logger.info("Player stopped");
    this.player.stop();
    this.queue = [];

    this.connection?.destroy();
    this.connection = null;
  }

  private playNext() {
    const nextUrl = this.queue.shift();
    if (!nextUrl) {
      this.stop();
      return null;
    }

    const stream = ytdl(nextUrl, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25,
    });

    this.player.play(createAudioResource(stream));
    return nextUrl;
  }
}

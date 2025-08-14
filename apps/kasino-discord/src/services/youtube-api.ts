import { config } from "../config.js";

const BASE_URL = "https://www.googleapis.com/youtube/v3";

export type YouTubeSearchItem = {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      [key: string]: {
        url: string;
        width: number;
        height: number;
      };
    };
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime: string;
  };
};

export type YouTubeSearchResponse = {
  kind: string;
  etag: string;
  nextPageToken?: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchItem[];
};

export class YouTubeAPI {
  private static instance: YouTubeAPI;
  public static getInstance(): YouTubeAPI {
    if (!YouTubeAPI.instance) {
      YouTubeAPI.instance = new YouTubeAPI();
    }

    return YouTubeAPI.instance;
  }

  async searchVideos(query: string): Promise<YouTubeSearchItem[]> {
    const url = new URL(BASE_URL + "/search");
    url.searchParams.set("type", "video");
    url.searchParams.set("q", query);
    url.searchParams.set("key", config.youtube.apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as YouTubeSearchResponse;
    return data.items.filter((item) => item.id.kind === "youtube#video");
  }
}

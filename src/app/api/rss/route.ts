import { NextRequest } from "next/server";
import { discoverFeeds } from "@/lib/rss/discovery";
import { fetchFeed } from "@/lib/rss/feed";
import {
  resolveYouTubeChannelId,
  fetchYouTubePopular,
} from "@/lib/rss/youtube";
import { fetchSpotifyData } from "@/lib/rss/spotify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const feed = searchParams.get("feed");
    const ytResolve = searchParams.get("youtubeResolve");
    const ytPopular = searchParams.get("youtubePopular");
    const spotifyPlaylist = searchParams.get("spotifyplaylist");
    const spotifyAlbum = searchParams.get("spotifyalbum");
    const spotifyArtist = searchParams.get("spotifyartist");
    const limitParam = parseInt(searchParams.get("limit") || "15", 10);
    const limit = isNaN(limitParam) ? 15 : limitParam;
    const pageParam = parseInt(searchParams.get("page") || "0", 10);
    const page = isNaN(pageParam) ? 0 : pageParam;

    if (ytResolve) {
      const result = await resolveYouTubeChannelId(ytResolve);
      if (!result.channelId) {
        return new Response(
          JSON.stringify({ error: "Could not resolve channel id" }),
          { status: 404 },
        );
      }
      return new Response(JSON.stringify(result), {
        headers: { "content-type": "application/json" },
      });
    }

    if (ytPopular) {
      try {
        const data = await fetchYouTubePopular(ytPopular, limit, page);
        return new Response(JSON.stringify(data), {
          headers: { "content-type": "application/json" },
        });
      } catch (e: any) {
        return new Response(
          JSON.stringify({ error: e?.message || "YouTube popular failed" }),
          { status: 500 },
        );
      }
    }

    if (spotifyPlaylist || spotifyAlbum || spotifyArtist) {
      try {
        let type: string, id: string;
        if (spotifyPlaylist) {
          type = "playlists";
          id = spotifyPlaylist;
        } else if (spotifyAlbum) {
          type = "albums";
          id = spotifyAlbum;
        } else {
          type = "artists";
          id = spotifyArtist!;
        }

        const spotifyData = await fetchSpotifyData(type, id, limit, page);
        if (spotifyData) {
          return new Response(JSON.stringify(spotifyData), {
            headers: { "content-type": "application/json" },
          });
        }

        const embedUrl = `https://open.spotify.com/embed/${type.replace("s", "")}/${id}`;
        const title = `Spotify ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        const items = [
          {
            id: `${type}_${id}`,
            title: `Spotify ${type}: ${id}`,
            link: `https://open.spotify.com/${type.replace("s", "")}/${id}`,
            published: new Date().toISOString(),
            summary: `Embedded Spotify ${type}`,
            thumbnail: undefined,
            embedUrl: embedUrl,
            isSpotify: true,
          },
        ];
        const data = { title, items, limit: 1, page: 0, hasMore: false };
        return new Response(JSON.stringify(data), {
          headers: { "content-type": "application/json" },
        });
      } catch (e: any) {
        return new Response(
          JSON.stringify({ error: e?.message || "Spotify request failed" }),
          { status: 500 },
        );
      }
    }

    if (!url && !feed) {
      return new Response(
        JSON.stringify({ error: "Missing url or feed param" }),
        { status: 400 },
      );
    }

    if (url && !feed) {
      const feeds = await discoverFeeds(url);
      return new Response(JSON.stringify({ feeds }), {
        headers: { "content-type": "application/json" },
      });
    }

    if (feed) {
      const data = await fetchFeed(feed, limit, page);
      return new Response(JSON.stringify(data), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "RSS error" }), {
      status: 500,
    });
  }
}

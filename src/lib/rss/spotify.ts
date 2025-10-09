export async function fetchSpotifyData(
  type: string,
  id: string,
  limit: number,
  page: number,
): Promise<any | null> {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.info(
        "[RSS] Spotify API credentials not configured, using fallback",
      );
      return null;
    }

    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        },
        body: "grant_type=client_credentials",
      },
    );

    if (!tokenResponse.ok) {
      console.error("[RSS] Failed to get Spotify access token");
      return null;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    let apiUrl: string;
    let title: string;

    if (type === "playlists") {
      apiUrl = `https://api.spotify.com/v1/playlists/${id}/tracks?limit=${limit}&offset=${page * limit}`;
      const playlistResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (playlistResponse.ok) {
        const playlistData = await playlistResponse.json();
        title = playlistData.name || `Spotify Playlist`;
      } else {
        title = `Spotify Playlist`;
      }
    } else if (type === "albums") {
      apiUrl = `https://api.spotify.com/v1/albums/${id}/tracks?limit=${limit}&offset=${page * limit}`;
      const albumResponse = await fetch(
        `https://api.spotify.com/v1/albums/${id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (albumResponse.ok) {
        const albumData = await albumResponse.json();
        title = albumData.name || `Spotify Album`;
      } else {
        title = `Spotify Album`;
      }
    } else if (type === "artists") {
      apiUrl = `https://api.spotify.com/v1/artists/${id}/top-tracks?market=TR`;
      const artistResponse = await fetch(
        `https://api.spotify.com/v1/artists/${id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (artistResponse.ok) {
        const artistData = await artistResponse.json();
        title = artistData.name || `Spotify Artist`;
      } else {
        title = `Spotify Artist`;
      }
    } else {
      return null;
    }

    const response = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error(`[RSS] Spotify API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const tracks = type === "artists" ? data.tracks : data.items;

    const items = tracks.map((track: any, index: number) => {
      const trackInfo = type === "artists" ? track : track.track;
      return {
        id: trackInfo.id,
        title: trackInfo.name,
        link: trackInfo.external_urls.spotify,
        published: trackInfo.album?.release_date,
        summary:
          `${trackInfo.artists.map((a: any) => a.name).join(", ")}` +
          (trackInfo.album?.name ? ` - ${trackInfo.album?.name}` : ""),
        thumbnail: trackInfo.album?.images?.[0]?.url,
        embedUrl: `https://open.spotify.com/embed/track/${trackInfo.id}`,
        isSpotify: true,
        trackNumber: type === "artists" ? index + 1 : track.track_number,
      };
    });

    return {
      title: title,
      items: items,
      limit: limit,
      page: page,
      hasMore: type === "artists" ? false : data.next !== null,
    };
  } catch (error) {
    console.error("[RSS] Spotify API error:", error);
    return null;
  }
}

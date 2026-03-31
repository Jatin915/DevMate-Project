const { extractPlaylistId } = require('./youtubeParser');

/**
 * Fetch playlist items via YouTube Data API v3 (requires YOUTUBE_API_KEY).
 */
async function fetchPlaylistItems(playlistUrlOrId) {
  const playlistId =
    typeof playlistUrlOrId === 'string' && playlistUrlOrId.startsWith('PL')
      ? playlistUrlOrId
      : extractPlaylistId(playlistUrlOrId);

  const key = process.env.YOUTUBE_API_KEY;
  if (!playlistId || !key) {
    return { playlistId, items: [] };
  }

  const base = 'https://www.googleapis.com/youtube/v3/playlistItems';
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    maxResults: '50',
    playlistId,
    key,
  });

  const res = await fetch(`${base}?${params}`);
  const data = await res.json();

  if (!data.items || data.error) {
    return { playlistId, items: [], error: data.error?.message };
  }

  const items = data.items.map((item, i) => ({
    title: item.snippet?.title || `Video ${i + 1}`,
    youtubeVideoId: item.contentDetails?.videoId || item.snippet?.resourceId?.videoId,
    thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
    order: i,
    duration: 0,
  }));

  return { playlistId, items: items.filter((v) => v.youtubeVideoId) };
}

module.exports = { fetchPlaylistItems };

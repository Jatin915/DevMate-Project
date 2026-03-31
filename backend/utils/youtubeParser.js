/**
 * Extract YouTube playlist ID from common URL formats.
 */
function extractPlaylistId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  const listMatch = trimmed.match(/[?&]list=([^&]+)/);
  if (listMatch) return decodeURIComponent(listMatch[1]);

  const embedPl = trimmed.match(/youtube\.com\/embed\/videoseries\?list=([^&]+)/i);
  if (embedPl) return decodeURIComponent(embedPl[1]);

  return null;
}

/**
 * Extract a single video ID from a watch or short URL.
 */
function extractVideoId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  const vMatch = trimmed.match(/[?&]v=([^&]+)/);
  if (vMatch) return vMatch[1];

  const shortMatch = trimmed.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];

  const embedMatch = trimmed.match(/youtube\.com\/embed\/([^?&]+)/i);
  if (embedMatch) return embedMatch[1];

  return null;
}

module.exports = { extractPlaylistId, extractVideoId };

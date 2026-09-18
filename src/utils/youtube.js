/**
 * YouTube URL utilities
 */

/**
 * Extract the YouTube video ID from various URL formats:
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/shorts/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  const patterns = [
    // Standard watch URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})(?:&|$|#)/,
    // Short URL
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?|$|#)/,
    // Shorts URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?|$|#)/,
    // Embed URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?|$|#)/,
    // Fallback: just v= anywhere
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
}

/**
 * Check if a string is a valid YouTube URL
 */
export function isYouTubeUrl(url) {
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Get the HQ thumbnail URL for a given video ID
 */
export function getYouTubeThumbnailUrl(videoId, quality = 'hqdefault') {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Get the full YouTube watch URL for a video ID
 */
export function getYouTubeWatchUrl(videoId) {
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Detect the first YouTube URL found in a block of text (Markdown content).
 * Returns { url, videoId } or null.
 */
export function detectYouTubeUrl(text) {
  if (!text) return null;
  // Match any youtube URL in the text
  const urlPattern = /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?(?:[^"'\s]*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s"'<>]*)?/g;
  const match = urlPattern.exec(text);
  if (match) {
    const videoId = extractYouTubeVideoId(match[0]);
    if (videoId) return { url: match[0], videoId };
  }
  return null;
}

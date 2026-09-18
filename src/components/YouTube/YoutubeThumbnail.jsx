import { useState } from 'react';
import { FiX, FiVideoOff } from 'react-icons/fi';
import { FaYoutube } from 'react-icons/fa6';

import { getYouTubeThumbnailUrl, getYouTubeWatchUrl } from '../../utils/youtube.js';
import { useSettings } from '../../hooks/useSettings.js';

/**
 * Clickable or embedded YouTube thumbnail preview component.
 * Automatically configured by global user settings, with optional prop overrides.
 */
export default function YoutubeThumbnail({
  videoId,
  title,
  className = '',
  settingsOverride = null,
}) {
  const { thumbnailSettings: globalSettings } = useSettings();
  const settings = settingsOverride || globalSettings;

  const [isPlaying, setIsPlaying] = useState(false);
  const [fallbackQuality, setFallbackQuality] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);

  const effectiveQuality = fallbackQuality || settings?.quality || 'hqdefault';


  if (!videoId) return null;

  const watchUrl = getYouTubeWatchUrl(videoId);
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${
    settings.enableAutoplay ? 1 : 0
  }&rel=0`;

  // Determine container width class based on settings
  const sizeClasses = {
    compact: 'max-w-md',
    medium: 'max-w-2xl',
    full: 'w-full max-w-none',
  };
  const sizeClass = sizeClasses[settings.size] || 'max-w-2xl';

  // Determine aspect ratio class
  const aspectClasses = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '21/9': 'aspect-[21/9]',
  };
  const aspectClass = aspectClasses[settings.aspectRatio] || 'aspect-video';

  const radiusClass = settings.borderRadius || 'rounded-xl';
  const shadowClass = settings.shadowEffect || 'shadow-lg';

  // If user chose always-embed or user clicked to play inside embed mode
  const shouldShowEmbed = settings.playbackMode === 'always-embed' || isPlaying;

  function handleImageError() {
    // Fallback cascade: maxresdefault -> hqdefault -> mqdefault -> failed placeholder
    if (effectiveQuality === 'maxresdefault') {
      setFallbackQuality('hqdefault');
    } else if (effectiveQuality === 'hqdefault') {
      setFallbackQuality('mqdefault');
    } else {
      setImgFailed(true);
    }
  }


  function handleClick(e) {
    if (settings.playbackMode === 'embed') {
      e.preventDefault();
      setIsPlaying(true);
    }
    // If 'tab', default <a> behavior opens new tab
  }

  return (
    <div className={`mx-auto ${sizeClass} ${className}`}>
      {shouldShowEmbed ? (
        <div className={`relative overflow-hidden ${aspectClass} ${radiusClass} border border-zinc-700 bg-black ${shadowClass}`}>
          <iframe
            src={embedUrl}
            title={title || 'YouTube video player'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          {/* Close embedded player button (only if user manually activated it) */}
          {settings.playbackMode !== 'always-embed' && (
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute top-2 right-2 z-20 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2 py-1 rounded-md text-xs backdrop-blur-sm border border-zinc-700 transition-colors flex items-center gap-1"
              title="Close player and return to thumbnail"
            >
              <FiX className="w-3 h-3" /> Close
            </button>
          )}
        </div>
      ) : (
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          title={title || 'Watch on YouTube'}
          className={`group block relative overflow-hidden ${aspectClass} ${radiusClass} border border-zinc-800 hover:border-red-500/80 transition-all duration-300 ${shadowClass} hover:shadow-red-950/40 bg-zinc-900 select-none`}
        >
          {/* Play button overlay */}
          {settings.showPlayButton && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-black/60 group-hover:bg-red-600/90 transition-all duration-200 rounded-full p-3.5 shadow-xl group-hover:scale-110">
                <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}

          {/* YouTube badge */}
          {settings.showBadge && (
            <div className="absolute top-2.5 right-2.5 z-10 bg-red-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1.5">
              <FaYoutube className="text-white text-xs shrink-0" /> YouTube
            </div>
          )}

          {/* Fallback placeholder when thumbnail cannot be loaded */}
          {imgFailed ? (
            <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center text-zinc-500 gap-2">
              <FiVideoOff className="w-10 h-10 opacity-60" />
              <span className="text-xs">Thumbnail unavailable</span>
            </div>
          ) : (
            <img
              src={getYouTubeThumbnailUrl(videoId, effectiveQuality)}
              alt={title || 'YouTube video thumbnail'}

              className={`w-full h-full object-cover transition-transform duration-300 ${
                settings.hoverZoom ? 'group-hover:scale-105' : ''
              }`}
              onError={handleImageError}
            />
          )}

          {/* Video Title banner */}
          {settings.showTitleBanner && title && (
            <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/95 via-black/70 to-transparent pt-6 pb-2.5 px-3.5 z-10">
              <p className="text-zinc-100 text-xs sm:text-sm font-medium line-clamp-2 leading-snug">

                {title}
              </p>
            </div>
          )}
        </a>
      )}
    </div>
  );
}

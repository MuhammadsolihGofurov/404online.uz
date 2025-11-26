import React, { useState, useRef, useEffect } from "react";
import { useIntl } from "react-intl";
import { Play, Pause, Volume2, Lock, AlertCircle } from "lucide-react";

/**
 * AudioPlayer
 * 
 * IELTS-compliant audio player for listening sections.
 * 
 * @param {string} audioUrl - URL of the audio file
 * @param {boolean} strictMode - If true, enforces IELTS exam rules (play once, no pause/scrub)
 * @param {boolean} allowPause - (Deprecated) Use strictMode instead
 */
export function AudioPlayer({ audioUrl, strictMode = false, allowPause = true }) {
  const intl = useIntl();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Determine if controls should be locked (strict mode or legacy allowPause=false)
  const isLocked = strictMode || !allowPause;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      // Don't reset currentTime in strict mode (show progress)
      if (!isLocked) {
        setCurrentTime(0);
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isLocked]);

  // Block keyboard shortcuts in strict mode (prevent spacebar pause)
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e) => {
      const audio = audioRef.current;
      if (!audio) return;

      // Block spacebar, k (YouTube shortcut), and other media keys
      if (e.key === " " || e.key === "k" || e.key === "MediaPlayPause") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Add listener to document to catch all keyboard events
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isLocked]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // In strict mode, cannot pause
      if (!isLocked) {
        audio.pause();
        setIsPlaying(false);
      }
    } else {
      // In strict mode, can only play once
      if (isLocked && hasPlayed) {
        return; // Prevent replay
      }
      audio.play();
      setIsPlaying(true);
      setHasPlayed(true);
    }
  };

  const handleSeek = (e) => {
    // Disable seeking in strict mode
    if (isLocked || !hasPlayed) return;
    
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className={`rounded-lg border p-4 ${
      isLocked 
        ? "bg-red-50 border-red-200" 
        : "bg-gray-50 border-gray-200"
    }`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Strict Mode Warning (Before Playing) */}
      {isLocked && !hasPlayed && (
        <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-start gap-2">
            <Lock size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                {intl.formatMessage({ id: "Exam Mode - Strict Audio Rules" })}
              </p>
              <p className="text-xs text-red-700 mt-1">
                {intl.formatMessage({ 
                  id: "⚠️ Audio will play only ONCE. You cannot pause, replay, or scrub." 
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isLocked && hasPlayed && !isPlaying}
          className={`p-3 rounded-full ${
            isPlaying
              ? isLocked
                ? "bg-red-500 text-white"
                : "bg-red-500 text-white hover:bg-red-600"
              : isLocked && hasPlayed
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-main text-white hover:bg-main/90"
          } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          title={
            isLocked && hasPlayed && !isPlaying
              ? intl.formatMessage({ id: "Audio can only be played once" })
              : isPlaying
              ? intl.formatMessage({ id: isLocked ? "Playing (Cannot Pause)" : "Pause" })
              : intl.formatMessage({ id: "Play" })
          }
        >
          {isPlaying ? (
            isLocked ? <Play size={20} /> : <Pause size={20} />
          ) : (
            <Play size={20} />
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <div
            className={`h-2 bg-gray-200 rounded-full relative ${
              isLocked ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            onClick={isLocked ? undefined : handleSeek}
          >
            <div
              className={`h-full rounded-full transition-all ${
                isLocked ? "bg-red-500" : "bg-main"
              }`}
              style={{
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
            {/* Lock indicator on progress bar */}
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock size={12} className="text-gray-400 opacity-50" />
              </div>
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Icon or Lock Icon */}
        {isLocked ? (
          <Lock size={20} className="text-red-500" />
        ) : (
          <Volume2 size={20} className="text-gray-400" />
        )}
      </div>

      {/* Strict Mode Status (After Playing) */}
      {isLocked && hasPlayed && !isPlaying && (
        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
            <p className="text-xs text-red-700">
              {intl.formatMessage({
                id: "Audio has finished. Replay is not allowed in exam mode.",
              })}
            </p>
          </div>
        </div>
      )}

      {/* Practice Mode Note */}
      {!isLocked && (
        <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
          <Volume2 size={12} />
          {intl.formatMessage({
            id: "Practice mode: You can pause, replay, and scrub the audio.",
          })}
        </p>
      )}
    </div>
  );
}


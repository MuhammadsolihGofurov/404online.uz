import React, { useState, useRef, useEffect } from "react";
import { useIntl } from "react-intl";
import { Play, Pause, Volume2 } from "lucide-react";

/**
 * AudioPlayer
 * 
 * Custom audio player for listening sections.
 * Respects allow_audio_pause setting from task.
 */
export function AudioPlayer({ audioUrl, allowPause = true }) {
  const intl = useIntl();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (allowPause) {
        audio.pause();
        setIsPlaying(false);
      }
    } else {
      audio.play();
      setIsPlaying(true);
      setHasPlayed(true);
    }
  };

  const handleSeek = (e) => {
    if (!allowPause || !hasPlayed) return;
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
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={!allowPause && hasPlayed && !isPlaying}
          className={`p-3 rounded-full ${
            isPlaying
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-main text-white hover:bg-main/90"
          } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          title={
            !allowPause && hasPlayed && !isPlaying
              ? intl.formatMessage({ id: "Audio can only be played once" })
              : isPlaying
              ? intl.formatMessage({ id: "Pause" })
              : intl.formatMessage({ id: "Play" })
          }
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <div
            className="h-2 bg-gray-200 rounded-full cursor-pointer relative"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-main rounded-full transition-all"
              style={{
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Icon */}
        <Volume2 size={20} className="text-gray-400" />
      </div>

      {!allowPause && hasPlayed && (
        <p className="text-xs text-orange-600 mt-2">
          {intl.formatMessage({
            id: "Note: This audio can only be played once. Pausing is not allowed.",
          })}
        </p>
      )}
    </div>
  );
}


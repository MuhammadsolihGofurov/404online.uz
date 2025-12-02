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
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Determine if controls should be locked (strict mode or legacy allowPause=false)
  const isLocked = strictMode || !allowPause;

  // Preload audio and show countdown for strict mode
  useEffect(() => {
    if (!isLocked || hasPlayed) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Wait for audio to be ready
    const handleCanPlay = () => {
      setIsAudioReady(true);
      // Show countdown overlay immediately when audio is ready
      setShowCountdown(true);
    };

    audio.addEventListener('canplay', handleCanPlay);
    
    // Force load the audio
    audio.load();

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [isLocked, hasPlayed]);

  // Countdown timer
  useEffect(() => {
    if (!showCountdown || !isAudioReady) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished - start audio automatically
      const audio = audioRef.current;
      if (audio) {
        audio.play()
          .then(() => {
            setIsPlaying(true);
            setHasPlayed(true);
            setShowCountdown(false);
          })
          .catch((error) => {
            console.error("Failed to play audio after countdown:", error);
            // Keep countdown visible so user can manually trigger
          });
      }
    }
  }, [countdown, showCountdown, isAudioReady]);

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

  // Prevent right-click and context menu on audio in strict mode
  useEffect(() => {
    if (!isLocked) return;

    const audio = audioRef.current;
    if (!audio) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    audio.addEventListener('contextmenu', handleContextMenu);

    return () => {
      audio.removeEventListener('contextmenu', handleContextMenu);
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
      // In strict mode, do nothing - cannot pause
      return;
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
    // Completely disable seeking in strict mode
    if (isLocked) return;
    if (!hasPlayed) return;

    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleManualStart = () => {
    const audio = audioRef.current;
    if (audio && showCountdown && countdown === 0) {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setHasPlayed(true);
          setShowCountdown(false);
        })
        .catch((err) => {
          console.error("Failed to play audio:", err);
        });
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className={`relative rounded-lg border p-4 ${isLocked
        ? "bg-red-50 border-red-200"
        : "bg-gray-50 border-gray-200"
      }`}>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="auto"
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={(e) => isLocked && e.preventDefault()}
      />

      {/* Countdown Overlay - Fullscreen and Unmissable */}
      {showCountdown && (
        <div className="fixed inset-0 bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center z-[9999]">
          <div className="max-w-2xl px-8 py-12 mx-4 text-center bg-white border-4 border-red-600 shadow-2xl rounded-3xl">
            {/* Warning Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-red-100 border-4 border-red-600 rounded-full">
                <Lock size={64} className="text-red-600" />
              </div>
            </div>

            {/* Main Message */}
            <h1 className="mb-4 text-3xl font-bold text-gray-900">
              {intl.formatMessage({ id: "Official Exam Mode" }) || "Official Exam Mode"}
            </h1>
            
            {/* Rules */}
            <div className="p-6 mb-8 border-2 border-red-200 bg-red-50 rounded-xl">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle size={24} className="flex-shrink-0 mt-1 text-red-600" />
                <div className="text-left">
                  <p className="mb-2 text-lg font-bold text-red-900">
                    {intl.formatMessage({ id: "Strict Audio Rules:" }) || "Strict Audio Rules:"}
                  </p>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-red-600">•</span>
                      <span>{intl.formatMessage({ id: "Audio will play ONLY ONCE" }) || "Audio will play ONLY ONCE"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-red-600">•</span>
                      <span>{intl.formatMessage({ id: "You CANNOT pause or stop the audio" }) || "You CANNOT pause or stop the audio"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-red-600">•</span>
                      <span>{intl.formatMessage({ id: "You CANNOT rewind or fast-forward" }) || "You CANNOT rewind or fast-forward"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-red-600">•</span>
                      <span>{intl.formatMessage({ id: "Once started, there is NO replay" }) || "Once started, there is NO replay"}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Countdown Display */}
            {countdown > 0 ? (
              <div className="mb-6">
                <p className="mb-4 text-lg font-medium text-gray-700">
                  {intl.formatMessage({ id: "Audio will start automatically in:" }) || "Audio will start automatically in:"}
                </p>
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full shadow-2xl bg-gradient-to-br from-red-500 to-red-700 animate-pulse">
                  <span className="text-6xl font-bold text-white">{countdown}</span>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <p className="mb-4 text-xl font-bold text-green-600 animate-pulse">
                  {intl.formatMessage({ id: "Starting Audio Now..." }) || "Starting Audio Now..."}
                </p>
                <button
                  onClick={handleManualStart}
                  className="flex items-center gap-3 px-8 py-4 mx-auto text-lg font-bold text-white transition-all transform bg-green-600 shadow-2xl hover:bg-green-700 rounded-xl hover:scale-105"
                >
                  <Play size={24} />
                  {intl.formatMessage({ id: "Click if Audio Doesn't Start" }) || "Click if Audio Doesn't Start"}
                </button>
              </div>
            )}

            {/* Additional Warning */}
            <p className="text-sm italic text-gray-600">
              {intl.formatMessage({ id: "Please ensure your volume is at a comfortable level" }) || "Please ensure your volume is at a comfortable level"}
            </p>
          </div>
        </div>
      )}

      {/* Loading State - Before Countdown */}
      {isLocked && !hasPlayed && !showCountdown && (
        <div className="p-3 mb-3 bg-blue-100 border border-blue-300 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm text-blue-800">
              {intl.formatMessage({ id: "Loading audio..." }) || "Loading audio..."}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isLocked && (hasPlayed || isPlaying)}
          className={`p-3 rounded-full ${isPlaying
            ? "bg-red-500 text-white cursor-default"
            : isLocked && hasPlayed
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-main text-white hover:bg-main/90"
            } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          title={
            isLocked && hasPlayed && !isPlaying
              ? intl.formatMessage({ id: "Audio can only be played once" })
              : isPlaying && isLocked
                ? intl.formatMessage({ id: "Playing (Cannot Pause)" })
                : isPlaying
                  ? intl.formatMessage({ id: "Pause" })
                  : intl.formatMessage({ id: "Play" })
          }
        >
          {isPlaying ? (
            <Play size={20} />
          ) : (
            <Play size={20} />
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <div
            className={`h-2 bg-gray-200 rounded-full relative ${isLocked ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            onClick={isLocked ? undefined : handleSeek}
            onMouseDown={isLocked ? (e) => e.preventDefault() : undefined}
            onTouchStart={isLocked ? (e) => e.preventDefault() : undefined}
          >
            <div
              className={`h-full rounded-full transition-all ${isLocked ? "bg-red-500" : "bg-main"
                }`}
              style={{
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
            {/* Lock indicator on progress bar */}
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Lock size={12} className="text-gray-400 opacity-50" />
              </div>
            )}
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
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
        <div className="p-2 mt-3 bg-red-100 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0 text-red-600" />
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
        <p className="flex items-center gap-1 mt-2 text-xs text-gray-600">
          <Volume2 size={12} />
          {intl.formatMessage({
            id: "Practice mode: You can pause, replay, and scrub the audio.",
          })}
        </p>
      )}
    </div>
  );
}


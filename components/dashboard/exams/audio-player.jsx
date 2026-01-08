import React, { useState, useRef } from "react";
import { useIntl } from "react-intl";
import { Volume2, Play } from "lucide-react";

function AudioPlayer({ audioSrc, allowControls = false, isPractice = false }) {
  const intl = useIntl();
  const [showModal, setShowModal] = useState(!allowControls); // Auto-show for exam mode
  const [audioStarted, setAudioStarted] = useState(false);
  const audioRef = useRef(null);

  const handleStartAudio = async () => {
    setShowModal(false);
    setAudioStarted(true);

    // Wait for next frame to ensure audio element is visible
    setTimeout(() => {
      if (audioRef.current) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Audio play failed:", error);
          });
        }
      }
    }, 100);
  };

  const handleAudioClick = () => {
    if (!allowControls && !audioStarted) {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Audio section - always rendered, hidden with opacity/visibility in exam mode until started */}
      <div
        className={`bg-white border-b border-gray-100 px-6 md:px-10 py-4 transition-opacity ${
          !audioStarted && !allowControls
            ? "opacity-0 invisible h-0 overflow-hidden"
            : "opacity-100 visible"
        }`}
      >
        <div className="flex items-center gap-4 max-w-6xl mx-auto">
          <audio
            ref={audioRef}
            controls={allowControls}
            controlsList={allowControls ? "" : "nodownload noplaybackrate"}
            className="flex-1 h-10"
            src={audioSrc}
            style={!allowControls ? { pointerEvents: "none" } : {}}
          />
        </div>
      </div>

      {/* Warning Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Volume2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {intl.formatMessage({
                  id: "Start Audio?",
                  defaultMessage: "Start Audio?",
                })}
              </h3>
              <p className="text-gray-600 text-sm">
                {intl.formatMessage({
                  id: "Once you start the audio, you cannot pause, rewind, or change it. The audio will play only once.",
                  defaultMessage:
                    "Once you start the audio, you cannot pause, rewind, or change it. The audio will play only once.",
                })}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleStartAudio}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                {intl.formatMessage({
                  id: "Start Audio",
                  defaultMessage: "Start Audio",
                })}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default React.memo(AudioPlayer);

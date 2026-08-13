import { useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";

import type { Movie } from "../services/database";

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
}

function VideoPlayer({
  movie,
  onClose,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(
    null
  );

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [volume, setVolume] =
    useState(1);

  const [error, setError] =
    useState<string | null>(null);

  const videoUrl = convertFileSrc(movie.path);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    function handleLoadedMetadata() {
      setDuration(video!.duration);
    }

    function handleTimeUpdate() {
      setCurrentTime(video!.currentTime);
    }

    function handlePlay() {
      setIsPlaying(true);
    }

    function handlePause() {
      setIsPlaying(false);
    }

    function handleError() {
      setError(
        "This video could not be played by the built-in player. The file may use a codec that WebView2 does not support."
      );
    }

    video.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    video.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    video.addEventListener(
      "play",
      handlePlay
    );

    video.addEventListener(
      "pause",
      handlePause
    );

    video.addEventListener(
      "error",
      handleError
    );

    return () => {
      video.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      video.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );

      video.removeEventListener(
        "play",
        handlePlay
      );

      video.removeEventListener(
        "pause",
        handlePause
      );

      video.removeEventListener(
        "error",
        handleError
      );
    };
  }, []);

  async function togglePlay() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      try {
        await video.play();
      } catch (error) {
        console.error(
          "Unable to play video:",
          error
        );

        setError(
          "The video could not be started."
        );
      }
    } else {
      video.pause();
    }
  }

  function handleSeek(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const newTime = Number(event.target.value);

    video.currentTime = newTime;

    setCurrentTime(newTime);
  }

  function handleVolume(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const newVolume =
      Number(event.target.value);

    const video = videoRef.current;

    if (video) {
      video.volume = newVolume;
    }

    setVolume(newVolume);
  }

  function toggleFullscreen() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  }

  function formatTime(seconds: number) {
    if (!Number.isFinite(seconds)) {
      return "00:00";
    }

    const totalSeconds =
      Math.floor(seconds);

    const hours =
      Math.floor(totalSeconds / 3600);

    const minutes =
      Math.floor(
        (totalSeconds % 3600) / 60
      );

    const remainingSeconds =
      totalSeconds % 60;

    const formattedMinutes =
      String(minutes).padStart(2, "0");

    const formattedSeconds =
      String(
        remainingSeconds
      ).padStart(2, "0");

    if (hours > 0) {
      return `${String(hours).padStart(
        2,
        "0"
      )}:${formattedMinutes}:${formattedSeconds}`;
    }

    return `${formattedMinutes}:${formattedSeconds}`;
  }

  return (
    <div className="video-player-overlay">
      <div className="video-player">

        <header className="video-player-header">
          <button
            className="video-close-button"
            onClick={onClose}
          >
            ×
          </button>

          <div>
            <h2>{movie.title}</h2>

            {movie.year && (
              <span>{movie.year}</span>
            )}
          </div>
        </header>

        <div className="video-container">

          <video
            ref={videoRef}
            className="video-element"
            src={videoUrl}
            preload="metadata"
          />

          {error && (
            <div className="video-error">
              <h3>
                Unable to play this file
              </h3>

              <p>{error}</p>

              <p className="video-error-path">
                {movie.path}
              </p>
            </div>
          )}

        </div>

        <div className="video-controls">

          <div className="progress-row">

            <span>
              {formatTime(currentTime)}
            </span>

            <input
              className="video-progress"
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
            />

            <span>
              {formatTime(duration)}
            </span>

          </div>

          <div className="controls-row">

            <button
              className="video-control-button"
              onClick={togglePlay}
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>

            <div className="volume-control">

              <span>🔊</span>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolume}
              />

            </div>

            <div className="controls-spacer" />

            <button
              className="video-control-button"
              onClick={toggleFullscreen}
            >
              ⛶
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

export default VideoPlayer;
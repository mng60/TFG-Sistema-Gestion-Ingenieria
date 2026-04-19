import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';

const formatAudioTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

function AudioMessage({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(audio.duration || 0);
    };
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error('Error reproduciendo audio:', error);
    }
  };

  const handleSeek = (event) => {
    const nextTime = Number(event.target.value);
    const audio = audioRef.current;
    setCurrentTime(nextTime);
    if (audio) {
      audio.currentTime = nextTime;
    }
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} preload="metadata" src={src} />

      <button
        type="button"
        className="audio-player-btn"
        onClick={togglePlayback}
        aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <div className="audio-player-track">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          onChange={handleSeek}
          className="audio-player-slider"
          aria-label="Posición del audio"
        />

        <div className="audio-player-time">
          <span>{formatAudioTime(currentTime)}</span>
          <span>/</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>

      <div className="audio-player-icon">
        <Volume2 size={18} />
      </div>
    </div>
  );
}

export default AudioMessage;

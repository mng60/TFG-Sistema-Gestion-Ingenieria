import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';

const formatAudioTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const getResolvedDuration = (audio) => {
  if (!audio) return 0;

  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    return audio.duration;
  }

  if (audio.seekable?.length) {
    const seekableEnd = audio.seekable.end(audio.seekable.length - 1);
    if (Number.isFinite(seekableEnd) && seekableEnd > 0) {
      return seekableEnd;
    }
  }

  return 0;
};

function AudioMessage({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const syncDuration = () => {
      setDuration((prevDuration) => {
        const resolvedDuration = getResolvedDuration(audio);
        return resolvedDuration > 0 ? resolvedDuration : prevDuration;
      });
    };

    const handleLoadedMetadata = () => syncDuration();
    const handleLoadedData = () => syncDuration();
    const handleCanPlay = () => syncDuration();
    const handleDurationChange = () => syncDuration();
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
      syncDuration();
    };
    const handleEnded = () => {
      setIsPlaying(false);
      const finalTime = audio.currentTime || getResolvedDuration(audio);
      setCurrentTime(finalTime);
      setDuration((prevDuration) => Math.max(prevDuration, finalTime));
    };
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handleEmptied = () => {
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    };

    setCurrentTime(0);
    setDuration(0);
    syncDuration();

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('emptied', handleEmptied);

    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('emptied', handleEmptied);
    };
  }, [src]);

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
          max={Math.max(duration, currentTime, 0.1)}
          step="0.1"
          value={Math.min(currentTime, Math.max(duration, currentTime, 0.1))}
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

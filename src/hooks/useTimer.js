// src/hooks/useTimer.js
import { useState, useRef, useCallback } from 'react';

export function useTimer(initialElapsedTime = 0) {
  const [elapsedTime, setElapsedTime] = useState(initialElapsedTime);
  const timerIntervalIdRef = useRef(null);

  const stopTimer = useCallback(() => {
    if (timerIntervalIdRef.current) {
      clearInterval(timerIntervalIdRef.current);
      timerIntervalIdRef.current = null;
    }
  }, []); // No dependencies as it only uses timerIntervalIdRef.current

  const startTimer = useCallback(() => {
    stopTimer(); // Clear any existing timer
    setElapsedTime(0); // Reset time when starting
    timerIntervalIdRef.current = setInterval(() => {
      setElapsedTime((prevTime) => prevTime + 1);
    }, 1000);
  }, [stopTimer]); // stopTimer is stable

  const resetTimer = useCallback(() => {
    stopTimer();
    setElapsedTime(0);
  }, [stopTimer]);

  // Cleanup timer on unmount
  // This useEffect is implicitly handled if the component using the hook unmounts
  // and calls stopTimer in its own cleanup.
  // However, if the hook itself were to manage its lifecycle independently,
  // it would need its own useEffect for cleanup, but that's usually tied to
  // the component lifecycle using it. For now, App.jsx's cleanup handles this.
  // We can add a specific cleanup if needed:
  // useEffect(() => {
  //   return () => stopTimer();
  // }, [stopTimer]);

  return {
    elapsedTime,
    startTimer,
    stopTimer,
    resetTimer, // Added for explicit reset if needed by startGame
    setElapsedTime, // Exposing this might be useful if App needs to set it directly (e.g. loading game)
  };
}

// src/components/TimerDisplay.jsx
import React from 'react';
import { formatTime } from '../logic/utils'; // Assuming formatTime is in utils

function TimerDisplay({ time }) {
  return <div className="timer-display">Time: {formatTime(time)}</div>;
}

export default TimerDisplay;

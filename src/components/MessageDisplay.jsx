// src/components/MessageDisplay.jsx
import React from 'react';

function MessageDisplay({ gameState, message }) {
  let className = 'playing'; // Default class for transparent message
  if (gameState === 'Won') className = 'won';
  if (gameState === 'Failed') className = 'failed';

  return (
    <div id="message-area" className={className}>
      {message}
    </div>
  );
}

export default MessageDisplay;

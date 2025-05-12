// src/components/ParticleEffect.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import ReactCanvasConfetti from 'react-canvas-confetti';

const canvasStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  zIndex: 1000, // Ensure it's on top
};

function ParticleEffect() {
  const refAnimationInstance = useRef(null);

  const getInstance = useCallback((instance) => {
    refAnimationInstance.current = instance;
  }, []);

  const makeShot = useCallback((particleRatio, opts) => {
    if (refAnimationInstance.current) {
      refAnimationInstance.current({
        ...opts,
        origin: { y: 0.6 }, // Fire from a bit above center
        particleCount: Math.floor(200 * particleRatio),
      });
    }
  }, []);

  useEffect(() => {
    // Trigger confetti on mount
    makeShot(0.25, { spread: 26, startVelocity: 55 });
    makeShot(0.2, { spread: 60 });
    makeShot(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    makeShot(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    makeShot(0.1, { spread: 120, startVelocity: 45 });
  }, [makeShot]);

  return <ReactCanvasConfetti refConfetti={getInstance} style={canvasStyles} />;
}

export default ParticleEffect;

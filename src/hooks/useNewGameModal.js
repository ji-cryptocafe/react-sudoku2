// src/hooks/useNewGameModal.js
import { useState, useCallback } from 'react';

export function useNewGameModal(initialState = false) {
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(initialState);

  const openNewGameModal = useCallback(() => {
    setIsNewGameModalOpen(true);
  }, []);

  const closeNewGameModal = useCallback(() => {
    setIsNewGameModalOpen(false);
  }, []);

  return {
    isNewGameModalOpen,
    openNewGameModal,
    closeNewGameModal,
    setIsNewGameModalOpen, // Expose setter if direct control is needed
  };
}

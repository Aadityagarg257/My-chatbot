import { useState, useEffect } from 'react';

// Simple hook to manage Pro status locally
export function usePro() {
  const [isPro, setIsPro] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem('ai-chat-pro-status');
    if (stored === 'true') {
      setIsPro(true);
    }
  }, []);

  const upgradeToPro = () => {
    localStorage.setItem('ai-chat-pro-status', 'true');
    setIsPro(true);
  };

  return { isPro, upgradeToPro };
}

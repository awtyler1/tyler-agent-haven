import { useState, useEffect } from 'react';
import { useFeatureFlags } from './useFeatureFlags';

export function useDarkMode() {
  const { isEnabled } = useFeatureFlags();
  const darkModeFeatureEnabled = isEnabled('dark_mode');
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggle = () => setIsDark(prev => !prev);

  return {
    isDark,
    toggle,
    featureEnabled: darkModeFeatureEnabled,
  };
}

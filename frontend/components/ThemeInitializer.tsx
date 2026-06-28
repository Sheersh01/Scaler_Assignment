'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/store';

export default function ThemeInitializer() {
  const { setTheme } = useThemeStore();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDark ? 'dark' : 'light');
    }
  }, [setTheme]);

  return null;
}

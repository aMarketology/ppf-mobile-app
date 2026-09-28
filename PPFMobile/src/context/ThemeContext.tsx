/**
 * ThemeContext — global light/dark mode state.
 *
 * Persists the user's choice in AsyncStorage and re-renders the whole
 * tree when toggled. Screens use `useTheme()` to read live colors/shadows
 * instead of the static `colors`/`shadows` imports.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppTheme,
  ThemeMode,
  getTheme,
  colors as fallbackColors,
  shadows as fallbackShadows,
} from '../theme';

const STORAGE_KEY = '@ppf/theme-mode';

interface ThemeContextValue {
  theme: AppTheme;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  colors: AppTheme['colors'];
  shadows: AppTheme['shadows'];
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: getTheme('dark'),
  mode: 'dark',
  isDark: true,
  setMode: () => {},
  toggle: () => {},
  colors: fallbackColors,
  shadows: fallbackShadows,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  // Restore persisted mode on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark') {
          setModeState(stored);
        }
      })
      .catch(() => { /* keep default */ });
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }

  function toggle() {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }

  const theme = getTheme(mode);

  const value: ThemeContextValue = {
    theme,
    mode,
    isDark: mode === 'dark',
    setMode,
    toggle,
    colors: theme.colors,
    shadows: theme.shadows,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
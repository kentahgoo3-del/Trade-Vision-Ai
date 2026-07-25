import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = '@tradevision:theme_preference';

interface ThemeContextValue {
  /** The stored preference (system / light / dark). */
  preference: ThemePreference;
  /** The resolved colour scheme after applying the preference. */
  resolvedScheme: 'light' | 'dark';
  setPreference: (pref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  resolvedScheme: 'light',
  setPreference: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (val === 'light' || val === 'dark' || val === 'system') {
          setPreferenceState(val);
        }
      })
      .catch(() => {
        // ignore read errors — fall back to 'system'
      })
      .finally(() => setLoaded(true));
  }, []);

  const setPreference = useCallback(async (pref: ThemePreference) => {
    setPreferenceState(pref);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // ignore write errors — preference is still applied in-memory
    }
  }, []);

  const resolvedScheme: 'light' | 'dark' =
    preference === 'system'
      ? (deviceScheme === 'dark' ? 'dark' : 'light')
      : preference;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ preference, resolvedScheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

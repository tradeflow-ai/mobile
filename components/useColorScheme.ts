import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { effectiveColorSchemeAtom, systemColorSchemeAtom } from '@/store/atoms';

export function useColorScheme() {
  const systemColorScheme = useSystemColorScheme();
  const [, setSystemColorScheme] = useAtom(systemColorSchemeAtom);
  const [effectiveColorScheme] = useAtom(effectiveColorSchemeAtom);

  // Update system color scheme atom when system preference changes
  useEffect(() => {
    if (systemColorScheme) {
      setSystemColorScheme(systemColorScheme);
    }
  }, [systemColorScheme, setSystemColorScheme]);

  return effectiveColorScheme;
}

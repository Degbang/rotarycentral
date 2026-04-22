import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    window.document.documentElement.dataset.theme = 'light';
  }, []);

  return <>{children}</>;
}

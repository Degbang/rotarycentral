import { useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isIos(): boolean {
  // iPadOS 13+ reports as Mac but with touch points.
  const ua = navigator.userAgent.toLowerCase();
  const isAppleMobile = /iphone|ipad|ipod/.test(ua);
  const isIpadOs = ua.includes('macintosh') && navigator.maxTouchPoints > 1;
  return isAppleMobile || isIpadOs;
}

function isIosSafari(): boolean {
  if (!isIos()) return false;
  const ua = navigator.userAgent.toLowerCase();
  // iOS Safari includes "safari" but not the iOS browser markers below.
  if (!ua.includes('safari')) return false;
  const nonSafariMarkers = ['crios', 'fxios', 'edgios', 'opios', 'gsa', 'fbav', 'instagram', 'line', 'wv'];
  return !nonSafariMarkers.some((marker) => ua.includes(marker));
}

function isInStandaloneMode(): boolean {
  // iOS Safari uses navigator.standalone; other browsers may expose display-mode.
  return (
    // @ts-expect-error: iOS standalone
    Boolean(window.navigator.standalone) ||
    window.matchMedia?.('(display-mode: standalone)')?.matches === true
  );
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(isInStandaloneMode());

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const canPrompt = useMemo(() => Boolean(deferred) && !installed, [deferred, installed]);
  const ios = useMemo(() => isIos(), []);
  const iosSafari = useMemo(() => isIosSafari(), []);
  const showIosHint = useMemo(() => ios && !installed, [installed, ios]);

  async function promptInstall() {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } finally {
      setDeferred(null);
    }
  }

  return { canPrompt, showIosHint, ios, iosSafari, promptInstall };
}

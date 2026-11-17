import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, X, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Compact app-install banner allowing Chrome/Android/Edge users to install BiteHour
 * directly to their home screen without needing Google Play / App Store downloads,
 * and giving iOS Safari users clean 2-step Share -> Add to Home Screen instructions.
 */
export const InstallPwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const isIos =
    typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(window.navigator.userAgent);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#edf7ed] text-[#1b4332] border border-[#c8e6c9] text-xs font-bold">
        <Check className="size-3.5 text-[#2e7d32]" />
        <span>App Installed on Device</span>
      </span>
    );
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }
    setShowIosGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-[#1b4332] border border-stone-200 hover:border-[#1b4332]/40 text-xs font-black shadow-2xs transition-all"
      >
        <Smartphone className="size-4 text-[#f37021]" />
        <span>{deferredPrompt ? 'Install BiteHour App' : 'Save App to Home Screen'}</span>
        <Download className="size-3.5 text-stone-500" />
      </button>

      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600"
            >
              <X className="size-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#edf7ed] text-[#1b4332] flex items-center justify-center">
                <Smartphone className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900">Get BiteHour on Your Phone</h3>
                <p className="text-xs text-stone-500">Zero App Store download needed (~1 MB)</p>
              </div>
            </div>

            <ol className="space-y-2.5 text-xs text-stone-700 font-medium bg-[#f7f5f0] p-4 rounded-2xl border border-[#e8e2d8]">
              {isIos ? (
                <>
                  <li className="flex items-center gap-2">
                    <span className="size-5 rounded-full bg-[#1b4332] text-white font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                    <span>Tap the <Share className="inline size-3.5 text-[#1b4332]" /> <strong>Share</strong> icon in Safari.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-5 rounded-full bg-[#1b4332] text-white font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                    <span>Scroll and tap <strong>Add to Home Screen</strong>.</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <span className="size-5 rounded-full bg-[#1b4332] text-white font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                    <span>Open your browser menu (<strong>⋮</strong> in Chrome / Edge).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-5 rounded-full bg-[#1b4332] text-white font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                    <span>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>
                  </li>
                </>
              )}
            </ol>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#1b4332] text-white font-black text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

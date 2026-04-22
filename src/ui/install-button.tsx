import * as Dialog from '@radix-ui/react-dialog';
import { Copy, Download, ExternalLink, PlusSquare, Share2, X } from 'lucide-react';
import { useInstallPrompt } from '@/features/install';
import { Button } from '@/ui/components';

export function InstallButton({ variant = 'secondary' }: { variant?: 'secondary' | 'ghost' }) {
  const { canPrompt, showIosHint, iosSafari, promptInstall } = useInstallPrompt();

  if (!canPrompt && !showIosHint) return null;

  if (canPrompt) {
    return (
      <Button type="button" variant={variant} size="sm" onClick={() => void promptInstall()}>
        <Download size={16} />
        Install
      </Button>
    );
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button type="button" variant={variant} size="sm">
          <Download size={16} />
          Install
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content install-sheet" aria-label="Install instructions">
          <div className="dialog-head">
            <div className="dialog-title">
              <strong>Install on iPhone / iPad</strong>
              <span className="muted">
                {iosSafari ? 'Add an icon to your Home Screen in two taps.' : 'To install, open this page in Safari.'}
              </span>
            </div>
            <Dialog.Close asChild>
              <button className="icon-button" type="button" aria-label="Close">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {iosSafari ? (
            <div className="install-steps" aria-label="Install steps">
              <div className="install-step">
                <span className="install-step-icon" aria-hidden="true">
                  <Share2 size={20} />
                </span>
                <div className="install-step-copy">
                  <strong>Tap Share</strong>
                  <span className="muted">Use the Share icon in Safari.</span>
                </div>
              </div>
              <div className="install-step">
                <span className="install-step-icon install-step-icon-gold" aria-hidden="true">
                  <PlusSquare size={20} />
                </span>
                <div className="install-step-copy">
                  <strong>Tap Add to Home Screen</strong>
                  <span className="muted">Then confirm Add.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="install-safari" aria-label="Open in Safari">
              <div className="callout-brand">
                <strong>Open in Safari to install</strong>
                <p className="muted">
                  Some iOS browsers and in-app browsers can’t install web apps.
                </p>
              </div>
              <div className="install-safari-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    const url = window.location.href;
                    try {
                      await navigator.clipboard.writeText(url);
                    } catch {
                      window.prompt('Copy this link:', url);
                    }
                  }}
                >
                  <Copy size={16} />
                  Copy link
                </Button>
                <a className="button button-ghost button-sm" href={window.location.href} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} />
                  Open
                </a>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

import * as Dialog from '@radix-ui/react-dialog';
import { Download, Share2, X } from 'lucide-react';
import { useInstallPrompt } from '@/features/install';
import { Button } from '@/ui/components';

export function InstallButton({ variant = 'secondary' }: { variant?: 'secondary' | 'ghost' }) {
  const { canPrompt, showIosHint, promptInstall } = useInstallPrompt();

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
        <Dialog.Content className="dialog-content" aria-label="Install instructions">
          <div className="dialog-head">
            <div className="dialog-title">
              <strong>Install this app</strong>
              <span className="muted">On iPhone/iPad, use Add to Home Screen.</span>
            </div>
            <Dialog.Close asChild>
              <button className="icon-button" type="button" aria-label="Close">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="plain-list">
            <p>
              1. Tap <strong>Share</strong> <Share2 size={16} style={{ verticalAlign: 'text-bottom' }} />
            </p>
            <p>2. Scroll and tap <strong>Add to Home Screen</strong></p>
            <p>3. Tap <strong>Add</strong></p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


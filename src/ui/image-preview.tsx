import * as Dialog from '@radix-ui/react-dialog';
import { Eye, X } from 'lucide-react';
import { Button } from '@/ui/components';

export function ImagePreviewButton({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button type="button" variant="ghost" size="sm" aria-label={`Preview image for ${title}`} title="Preview">
          <Eye size={16} />
          <span className="action-text">Preview</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content image-dialog" aria-label="Image preview">
          <div className="dialog-head">
            <div className="dialog-title">
              <strong>{title}</strong>
              <span className="muted">Tap outside the image to close.</span>
            </div>
            <Dialog.Close asChild>
              <button className="icon-button" type="button" aria-label="Close preview">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="image-dialog-frame">
            <img src={src} alt="" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

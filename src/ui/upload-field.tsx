import { StoredAttachment } from '@/data/model';
import { deleteAttachment, uploadAttachment } from '@/data/api';
import { Button, Card, Field } from '@/ui/components';
import { formatFileSize } from '@/ui/formatters';
import { useState } from 'react';

interface UploadFieldProps {
  label: string;
  hint: string;
  value: StoredAttachment[];
  onChange: (value: StoredAttachment[]) => void;
  accept: string;
  maxFiles?: number;
  kind: 'flyer' | 'cover' | 'image' | 'pdf';
}

export function UploadField({ label, hint, value, onChange, accept, maxFiles = 10, kind }: UploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    const acceptedFiles = Array.from(fileList).slice(0, Math.max(0, maxFiles - value.length));
    if (acceptedFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    try {
      const uploaded = await Promise.all(acceptedFiles.map((file) => uploadAttachment(file, kind)));
      onChange([...value, ...uploaded]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Field label={label} hint={hint}>
      <Card className="upload-panel">
        <input
          className="input"
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          disabled={isUploading}
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.currentTarget.value = '';
          }}
        />
        <div className="attachment-list">
          {isUploading ? <p className="muted">Uploading...</p> : null}
          {errorMessage ? <p className="field-error">{errorMessage}</p> : null}
          {value.length === 0 && !isUploading ? <p className="muted">No files added yet.</p> : null}
          {value.map((attachment) => (
            <div className="attachment-item" key={attachment.id}>
              <div>
                <strong>{attachment.name}</strong>
                <p>
                  {attachment.category === 'pdf' ? 'PDF' : 'Image'} · {formatFileSize(attachment.size)}
                </p>
              </div>
              <div className="attachment-actions">
                {attachment.dataUrl ? (
                  <a className="text-link" href={attachment.dataUrl} target="_blank" rel="noreferrer">
                    Preview
                  </a>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await deleteAttachment(attachment);
                    onChange(value.filter((entry) => entry.id !== attachment.id));
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Field>
  );
}

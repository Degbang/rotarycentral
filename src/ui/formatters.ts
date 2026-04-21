import { format } from 'date-fns';
import { ProjectProgressStatus, RecordStatus } from '@/data/model';

export function formatDateLabel(value: string): string {
  if (!value) {
    return 'Not set';
  }

  return format(new Date(`${value}T12:00:00`), 'EEE, d MMM yyyy');
}

export function formatDateTimeLabel(date: string, time?: string, isAllDay?: boolean): string {
  if (!date) {
    return 'Date not set';
  }

  if (isAllDay) {
    return `${formatDateLabel(date)} · All day`;
  }

  if (!time) {
    return formatDateLabel(date);
  }

  return `${formatDateLabel(date)} · ${time}`;
}

export function formatStatusLabel(status: RecordStatus | ProjectProgressStatus): string {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatRoleLabel(role: string): string {
  return role
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

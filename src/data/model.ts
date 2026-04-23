export const RECORD_STATUSES = ['DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'PUBLISHED', 'ARCHIVED'] as const;

export const PROJECT_PROGRESS_STATUSES = ['Planning', 'Active', 'Completed', 'Paused'] as const;
export const CLUB_TYPES = ['Rotary Club', 'Rotaract Club'] as const;
export const DISTRICT_CLUB_SHORT_NAME = 'District9104' as const;

export type RecordStatus = (typeof RECORD_STATUSES)[number];
export type ProjectProgressStatus = (typeof PROJECT_PROGRESS_STATUSES)[number];
export type ClubType = (typeof CLUB_TYPES)[number];
export type Role = 'VIEWER' | 'STAFF';

export type Permission =
  | 'event.read'
  | 'event.create'
  | 'event.edit.own'
  | 'event.publish'
  | 'project.read'
  | 'project.create'
  | 'project.edit.own'
  | 'project.publish'
  | 'staff.access';

export interface StoredAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  category: 'image' | 'pdf';
  bucket?: string;
  objectPath?: string;
  dataUrl?: string;
  uploadedAt: string;
}

export interface ClubRecord {
  id: string;
  name: string;
  shortName: string;
  type: ClubType;
  location: string;
  description: string;
  contactEmail: string;
  colorTone: 'rotary' | 'rotaract';
}

export interface ThemeRecord {
  id: string;
  name: string;
  description: string;
}

export interface EventRecord {
  id: string;
  title: string;
  clubId: string;
  themeId: string;
  date: string;
  time?: string;
  isAllDay: boolean;
  location: string;
  description: string;
  flyer?: StoredAttachment | null;
  images: StoredAttachment[];
  documents: StoredAttachment[];
  contactPerson: string;
  status: RecordStatus;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
  changeNote?: string;
}

export interface ProjectRecord {
  id: string;
  title: string;
  clubId: string;
  themeId: string;
  projectStatus: ProjectProgressStatus;
  location: string;
  startDate: string;
  description: string;
  coverImage?: StoredAttachment | null;
  images: StoredAttachment[];
  documents: StoredAttachment[];
  status: RecordStatus;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
  changeNote?: string;
}

export type AnnouncementScope = 'DISTRICT' | 'CLUB';

export interface AnnouncementRecord {
  id: string;
  title: string;
  body: string;
  scope: AnnouncementScope;
  clubId?: string | null;
  status: RecordStatus;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionPayload {
  user: {
    id: string;
    displayName: string;
    email: string;
    status: 'ACTIVE' | 'DISABLED';
  };
  roles: Role[];
  permissions: Permission[];
  clubIds: string[];
  defaultRoute: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rotaryId: string;
}

export interface EventEditorInput {
  title: string;
  clubId: string;
  themeId: string;
  date: string;
  time?: string;
  isAllDay: boolean;
  location: string;
  description: string;
  flyer?: StoredAttachment | null;
  images: StoredAttachment[];
  documents: StoredAttachment[];
  contactPerson: string;
}

export interface ProjectEditorInput {
  title: string;
  clubId: string;
  themeId: string;
  projectStatus: ProjectProgressStatus;
  location: string;
  startDate: string;
  description: string;
  coverImage?: StoredAttachment | null;
  images: StoredAttachment[];
  documents: StoredAttachment[];
}

export interface AnnouncementEditorInput {
  title: string;
  body: string;
  scope: AnnouncementScope;
  clubId?: string | null;
}

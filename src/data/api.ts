import { supabase } from '@/data/supabaseClient';
import {
  ClubRecord,
  EventEditorInput,
  EventRecord,
  LoginInput,
  Permission,
  ProjectEditorInput,
  ProjectRecord,
  RecordStatus,
  SessionPayload,
  StoredAttachment,
  ThemeRecord,
} from '@/data/model';

type ProfileRow = {
  id: string;
  display_name: string;
  email: string;
  rotary_id: string;
  status: 'ACTIVE' | 'DISABLED';
  roles: string[];
  permissions: string[];
  club_ids: string[];
};

type DbEventRow = {
  id: string;
  title: string;
  club_id: string;
  theme_id: string;
  date: string;
  time: string | null;
  is_all_day: boolean;
  location: string;
  description: string;
  contact_person: string;
  status: RecordStatus;
  owner_user_id: string;
  change_note: string | null;
  flyer: unknown | null;
  images: unknown;
  documents: unknown;
  created_at: string;
  updated_at: string;
};

type DbProjectRow = {
  id: string;
  title: string;
  club_id: string;
  theme_id: string;
  project_status: 'Planning' | 'Active' | 'Completed' | 'Paused';
  location: string;
  start_date: string;
  description: string;
  status: RecordStatus;
  owner_user_id: string;
  change_note: string | null;
  cover_image: unknown | null;
  images: unknown;
  documents: unknown;
  created_at: string;
  updated_at: string;
};

function uniqueById(items: StoredAttachment[]): StoredAttachment[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 140);
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  // createImageBitmap is broadly supported and avoids layout thrash from <img>.
  return await createImageBitmap(file);
}

function computeScaledSize(width: number, height: number, maxEdge: number) {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width, height, scale: 1 };
  const scale = maxEdge / longEdge;
  return { width: Math.round(width * scale), height: Math.round(height * scale), scale };
}

async function downscaleAndEncodeImage(
  file: File,
  {
    maxEdge,
    quality,
  }: {
    maxEdge: number;
    quality: number;
  },
): Promise<File> {
  const bitmap = await loadImageBitmap(file);
  const target = computeScaledSize(bitmap.width, bitmap.height, maxEdge);

  if (target.scale === 1 && file.size <= MAX_IMAGE_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, target.width, target.height);
  bitmap.close();

  const wantsPng = file.type === 'image/png';
  const outType = wantsPng ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outType, wantsPng ? undefined : quality),
  );
  if (!blob) return file;

  // Guardrail: if we couldn't reduce size meaningfully, keep the original name/type.
  // (We still keep the resized pixels if scaling happened.)

  const originalBase = file.name.replace(/\.[a-z0-9]+$/i, '');
  const nextExt = outType === 'image/png' ? 'png' : 'jpg';
  const nextName = `${sanitizeFilename(originalBase)}.${nextExt}`;

  return new File([blob], nextName, { type: outType, lastModified: Date.now() });
}

function deriveDefaultRoute(permissions: Permission[]): string {
  return '/events';
}

function buildSessionPayload(profile: ProfileRow): SessionPayload {
  const roles = (profile.roles ?? []) as SessionPayload['roles'];
  const permissions = (profile.permissions ?? []) as Permission[];
  return {
    user: {
      id: profile.id,
      displayName: profile.display_name,
      email: profile.email,
      status: profile.status,
    },
    roles,
    permissions,
    clubIds: profile.club_ids ?? [],
    defaultRoute: deriveDefaultRoute(permissions),
  };
}

async function requireProfile(userId: string): Promise<ProfileRow> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error('Your account is not set up yet. Contact the district team.');
  }
  if (data.status !== 'ACTIVE') {
    throw new Error('Your account is currently disabled.');
  }
  return data as ProfileRow;
}

const SIGNED_URL_TTL_SECONDS = 10 * 60; // keep exposure window short

async function signUrlIfNeeded(attachment: StoredAttachment): Promise<StoredAttachment> {
  if (!attachment.bucket || !attachment.objectPath) {
    return attachment;
  }

  const { data, error } = await supabase.storage
    .from(attachment.bucket)
    .createSignedUrl(attachment.objectPath, SIGNED_URL_TTL_SECONDS);
  if (error) {
    return { ...attachment, dataUrl: undefined };
  }
  return { ...attachment, dataUrl: data.signedUrl };
}

function parseAttachments(raw: unknown): StoredAttachment[] {
  if (!raw) return [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => item as Partial<StoredAttachment>)
    .filter((item): item is StoredAttachment => Boolean(item?.id && item?.name && item?.mimeType && item?.uploadedAt))
    .map((item) => ({
      id: String(item.id),
      name: String(item.name),
      mimeType: String(item.mimeType),
      size: Number(item.size ?? 0),
      category: item.category === 'pdf' ? 'pdf' : 'image',
      bucket: item.bucket ? String(item.bucket) : undefined,
      objectPath: item.objectPath ? String(item.objectPath) : undefined,
      dataUrl: item.dataUrl ? String(item.dataUrl) : undefined,
      uploadedAt: String(item.uploadedAt),
    }));
}

function parseAttachment(raw: unknown): StoredAttachment | null {
  if (!raw || typeof raw !== 'object') return null;
  const parsed = parseAttachments([raw])[0];
  return parsed ?? null;
}

function stripSignedUrl(attachment: StoredAttachment): StoredAttachment {
  if (attachment.bucket && attachment.objectPath) {
    const { dataUrl, ...rest } = attachment;
    return rest;
  }

  return attachment;
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const { data } = await supabase.auth.getSession();
  const authSession = data.session;
  if (!authSession?.user) return null;

  try {
    const profile = await requireProfile(authSession.user.id);
    return buildSessionPayload(profile);
  } catch {
    await supabase.auth.signOut();
    return null;
  }
}

export async function loginWithCredentials(input: LoginInput): Promise<SessionPayload> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });
  if (error) throw error;
  if (!data.user) throw new Error('Unable to sign in.');

  const profile = await requireProfile(data.user.id);
  if (profile.rotary_id !== input.rotaryId.trim()) {
    await supabase.auth.signOut();
    throw new Error('We could not verify your details. Check your email, password, and Rotary ID.');
  }

  return buildSessionPayload(profile);
}

export async function logoutSession(): Promise<void> {
  await supabase.auth.signOut();
}

export async function listClubs(): Promise<ClubRecord[]> {
  const { data, error } = await supabase.from('clubs').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    type: row.type,
    location: row.location,
    description: row.description,
    contactEmail: row.contact_email,
    colorTone: row.color_tone,
  })) as ClubRecord[];
}

export async function listThemes(): Promise<ThemeRecord[]> {
  const { data, error } = await supabase.from('themes').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
  })) as ThemeRecord[];
}

async function hydrateEvent(row: DbEventRow): Promise<EventRecord> {
  const flyer = parseAttachment(row.flyer);
  const images = parseAttachments(row.images);
  const documents = parseAttachments(row.documents);

  const signed = await Promise.all([
    flyer ? signUrlIfNeeded(flyer) : Promise.resolve(null),
    ...images.map(signUrlIfNeeded),
    ...documents.map(signUrlIfNeeded),
  ]);

  const signedFlyer = signed[0] as StoredAttachment | null;
  const signedImages = signed.slice(1, 1 + images.length) as StoredAttachment[];
  const signedDocuments = signed.slice(1 + images.length) as StoredAttachment[];

  return {
    id: row.id,
    title: row.title,
    clubId: row.club_id,
    themeId: row.theme_id,
    date: row.date,
    time: row.time ?? undefined,
    isAllDay: row.is_all_day,
    location: row.location,
    description: row.description,
    flyer: signedFlyer,
    images: signedImages,
    documents: signedDocuments,
    contactPerson: row.contact_person,
    status: row.status,
    ownerUserId: row.owner_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    changeNote: row.change_note ?? undefined,
  };
}

async function hydrateProject(row: DbProjectRow): Promise<ProjectRecord> {
  const coverImage = parseAttachment(row.cover_image);
  const images = parseAttachments(row.images);
  const documents = parseAttachments(row.documents);

  const signed = await Promise.all([
    coverImage ? signUrlIfNeeded(coverImage) : Promise.resolve(null),
    ...images.map(signUrlIfNeeded),
    ...documents.map(signUrlIfNeeded),
  ]);

  const signedCover = signed[0] as StoredAttachment | null;
  const signedImages = signed.slice(1, 1 + images.length) as StoredAttachment[];
  const signedDocuments = signed.slice(1 + images.length) as StoredAttachment[];

  return {
    id: row.id,
    title: row.title,
    clubId: row.club_id,
    themeId: row.theme_id,
    projectStatus: row.project_status,
    location: row.location,
    startDate: row.start_date,
    description: row.description,
    coverImage: signedCover,
    images: signedImages,
    documents: signedDocuments,
    status: row.status,
    ownerUserId: row.owner_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    changeNote: row.change_note ?? undefined,
  };
}

export async function listEvents(_session: SessionPayload): Promise<EventRecord[]> {
  const { data, error } = await supabase.from('events').select('*').order('date');
  if (error) throw error;
  const rows = (data ?? []) as DbEventRow[];
  return Promise.all(rows.map(hydrateEvent));
}

export async function listProjects(_session: SessionPayload): Promise<ProjectRecord[]> {
  const { data, error } = await supabase.from('projects').select('*').order('start_date');
  if (error) throw error;
  const rows = (data ?? []) as DbProjectRow[];
  return Promise.all(rows.map(hydrateProject));
}

export async function getEventById(_session: SessionPayload, eventId: string): Promise<EventRecord> {
  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('That event is not available.');
  return hydrateEvent(data as DbEventRow);
}

export async function getProjectById(_session: SessionPayload, projectId: string): Promise<ProjectRecord> {
  const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('That project is not available.');
  return hydrateProject(data as DbProjectRow);
}

export async function uploadAttachment(file: File, kind: 'flyer' | 'cover' | 'image' | 'pdf'): Promise<StoredAttachment> {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);
  if (!allowedTypes.has(file.type)) {
    throw new Error('Unsupported file type. Use JPG, PNG, or PDF.');
  }

  if (file.type === 'application/pdf' && file.size > MAX_PDF_BYTES) {
    throw new Error('PDF is too large. Please upload a PDF under 10MB.');
  }

  let uploadFile = file;
  if (file.type === 'image/jpeg' || file.type === 'image/png') {
    // Always downscale very large images to keep cards and storage predictable.
    const maxEdge = kind === 'flyer' || kind === 'cover' ? 2048 : 1920;
    const quality = kind === 'flyer' || kind === 'cover' ? 0.86 : 0.82;

    // Resize if dimensions are huge, even when the file is small-ish (common with modern phone photos).
    uploadFile = await downscaleAndEncodeImage(file, { maxEdge, quality });

    if (uploadFile.size > MAX_IMAGE_BYTES) {
      throw new Error('Image is too large. Please upload an image under 5MB.');
    }
  }

  // Use the locally available auth session (no network call) to avoid "Auth session missing" during uploads.
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const authSession = sessionData.session;
  if (!authSession?.user) {
    throw new Error('Your session has expired. Please sign in again and retry the upload.');
  }

  const bucket = 'attachments';
  const objectPath = `${authSession.user.id}/${kind}/${crypto.randomUUID()}-${sanitizeFilename(uploadFile.name)}`;
  const uploadResult = await supabase.storage.from(bucket).upload(objectPath, uploadFile, {
    contentType: uploadFile.type,
    upsert: false,
  });
  if (uploadResult.error) {
    const message = String((uploadResult.error as any)?.message ?? uploadResult.error);
    if (message.toLowerCase().includes('auth session missing') || message.toLowerCase().includes('jwt')) {
      throw new Error('Upload failed because your session is missing or expired. Please sign in again and retry.');
    }
    throw uploadResult.error;
  }

  const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);
  const uploadedAt = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: uploadFile.name,
    mimeType: uploadFile.type,
    size: uploadFile.size,
    category: uploadFile.type === 'application/pdf' ? 'pdf' : 'image',
    bucket,
    objectPath,
    dataUrl: signed?.signedUrl,
    uploadedAt,
  };
}

export async function deleteAttachment(attachment: StoredAttachment): Promise<void> {
  if (!attachment.bucket || !attachment.objectPath) return;
  await supabase.storage.from(attachment.bucket).remove([attachment.objectPath]);
}

export async function saveEvent(
  session: SessionPayload,
  input: EventEditorInput,
  nextStatus: RecordStatus,
  eventId?: string,
): Promise<EventRecord> {
  const payload = {
    title: input.title.trim(),
    club_id: input.clubId,
    theme_id: input.themeId,
    date: input.date,
    time: input.isAllDay ? null : input.time ?? null,
    is_all_day: input.isAllDay,
    location: input.location.trim(),
    description: input.description.trim(),
    contact_person: input.contactPerson.trim(),
    status: nextStatus,
    owner_user_id: session.user.id,
    flyer: input.flyer ? stripSignedUrl(input.flyer) : null,
    images: uniqueById((input.images ?? []).map(stripSignedUrl)),
    documents: uniqueById((input.documents ?? []).map(stripSignedUrl)),
  };

  if (eventId) {
    const { data, error } = await supabase.from('events').update(payload).eq('id', eventId).select('*').maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('The event could not be saved.');
    return hydrateEvent(data as DbEventRow);
  }

  const { data, error } = await supabase.from('events').insert(payload).select('*').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('The event could not be created.');
  return hydrateEvent(data as DbEventRow);
}

export async function saveProject(
  session: SessionPayload,
  input: ProjectEditorInput,
  nextStatus: RecordStatus,
  projectId?: string,
): Promise<ProjectRecord> {
  const payload = {
    title: input.title.trim(),
    club_id: input.clubId,
    theme_id: input.themeId,
    project_status: input.projectStatus,
    location: input.location.trim(),
    start_date: input.startDate,
    description: input.description.trim(),
    status: nextStatus,
    owner_user_id: session.user.id,
    cover_image: input.coverImage ? stripSignedUrl(input.coverImage) : null,
    images: uniqueById((input.images ?? []).map(stripSignedUrl)),
    documents: uniqueById((input.documents ?? []).map(stripSignedUrl)),
  };

  if (projectId) {
    const { data, error } = await supabase.from('projects').update(payload).eq('id', projectId).select('*').maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('The project could not be saved.');
    return hydrateProject(data as DbProjectRow);
  }

  const { data, error } = await supabase.from('projects').insert(payload).select('*').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('The project could not be created.');
  return hydrateProject(data as DbProjectRow);
}

import { EventRecord, Permission, ProjectRecord, SessionPayload } from '@/data/model';

export function hasPermission(session: SessionPayload | null, permission: Permission): boolean {
  return Boolean(session?.permissions.includes(permission));
}

export function canEditEvent(session: SessionPayload | null, event: EventRecord): boolean {
  if (!session) {
    return false;
  }

  return (
    (session.permissions.includes('event.edit.own') && event.ownerUserId === session.user.id)
  );
}

export function canEditProject(session: SessionPayload | null, project: ProjectRecord): boolean {
  if (!session) {
    return false;
  }

  return (
    (session.permissions.includes('project.edit.own') && project.ownerUserId === session.user.id)
  );
}

import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getEventById, listClubs, listThemes } from '@/data/api';
import { useAuth } from '@/features/auth';
import { canEditEvent } from '@/features/permissions';
import { Badge, Button, Card, MetaList, PageHeader, StatusBadge } from '@/ui/components';
import { formatDateTimeLabel, formatFileSize } from '@/ui/formatters';

export function EventDetailPage() {
  const { eventId = '' } = useParams();
  const { session } = useAuth();
  const eventQuery = useQuery({ queryKey: ['event', eventId], queryFn: () => getEventById(session!, eventId), enabled: Boolean(session && eventId) });
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: listClubs });
  const themesQuery = useQuery({ queryKey: ['themes'], queryFn: listThemes });

  if (!session || !eventQuery.data) {
    return <div className="auth-loading">Loading event...</div>;
  }

  const event = eventQuery.data;
  const club = clubsQuery.data?.find((entry) => entry.id === event.clubId);
  const theme = themesQuery.data?.find((entry) => entry.id === event.themeId);

  return (
    <div className="page-stack detail-page">
      <PageHeader
        title={event.title}
        description={club ? `${club.name} · ${event.location}` : event.location}
        actions={
          canEditEvent(session, event) ? (
            <Button asChild>
              <Link to={`/events/${event.id}/edit`}>Edit</Link>
            </Button>
          ) : undefined
        }
      />

      <div className="detail-layout">
        <section className="page-stack">
          <Card>
            <div className="inline-badges">
              <StatusBadge status={event.status} />
              {theme ? <Badge>{theme.name}</Badge> : null}
              {club ? <Badge variant="gold">{club.shortName}</Badge> : null}
            </div>
            <p className="detail-body">{event.description}</p>
            {event.changeNote ? <p className="callout-warning">Editor note: {event.changeNote}</p> : null}
          </Card>

          <Card>
            <h2>Media and attachments</h2>
            <div className="attachment-list">
              {event.flyer ? (
                <a className="attachment-item" href={event.flyer.dataUrl} target="_blank" rel="noreferrer">
                  <div>
                    <strong>{event.flyer.name}</strong>
                    <p>Flyer · {formatFileSize(event.flyer.size)}</p>
                  </div>
                </a>
              ) : null}
              {event.images.map((image) => (
                <a className="attachment-item" href={image.dataUrl} target="_blank" rel="noreferrer" key={image.id}>
                  <div>
                    <strong>{image.name}</strong>
                    <p>Image · {formatFileSize(image.size)}</p>
                  </div>
                </a>
              ))}
              {event.documents.map((document) => (
                <a className="attachment-item" href={document.dataUrl} target="_blank" rel="noreferrer" key={document.id}>
                  <div>
                    <strong>{document.name}</strong>
                    <p>PDF · {formatFileSize(document.size)}</p>
                  </div>
                </a>
              ))}
              {!event.flyer && event.images.length === 0 && event.documents.length === 0 ? <p className="muted">No media or attachments added yet.</p> : null}
            </div>
          </Card>
        </section>

        <Card>
          <h2>Event details</h2>
          <MetaList
            items={[
              { label: 'Club', value: club?.name ?? 'Unknown club' },
              { label: 'Theme', value: theme?.name ?? 'Not set' },
              { label: 'Date and time', value: formatDateTimeLabel(event.date, event.time, event.isAllDay) },
              { label: 'Location', value: event.location },
              { label: 'Contact person', value: event.contactPerson },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

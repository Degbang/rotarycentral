import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getProjectById, listClubs, listThemes } from '@/data/api';
import { useAuth } from '@/features/auth';
import { canEditProject } from '@/features/permissions';
import { Badge, Button, Card, MetaList, PageHeader, StatusBadge } from '@/ui/components';
import { formatDateLabel, formatFileSize, formatStatusLabel } from '@/ui/formatters';

export function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const { session } = useAuth();
  const projectQuery = useQuery({ queryKey: ['project', projectId], queryFn: () => getProjectById(session!, projectId), enabled: Boolean(session && projectId) });
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: listClubs });
  const themesQuery = useQuery({ queryKey: ['themes'], queryFn: listThemes });

  if (!session || !projectQuery.data) {
    return <div className="auth-loading">Loading project...</div>;
  }

  const project = projectQuery.data;
  const club = clubsQuery.data?.find((entry) => entry.id === project.clubId);
  const theme = themesQuery.data?.find((entry) => entry.id === project.themeId);

  return (
    <div className="page-stack detail-page">
      <PageHeader
        title={project.title}
        description={club ? `${club.name} · ${project.location}` : project.location}
        actions={
          canEditProject(session, project) ? (
            <Button asChild>
              <Link to={`/projects/${project.id}/edit`}>Edit</Link>
            </Button>
          ) : undefined
        }
      />

      <div className="detail-layout">
        <section className="page-stack">
          <Card>
            <div className="inline-badges">
              <StatusBadge status={project.status} />
              <Badge variant="brand">{formatStatusLabel(project.projectStatus)}</Badge>
              {theme ? <Badge>{theme.name}</Badge> : null}
            </div>
            <p className="detail-body">{project.description}</p>
            {project.changeNote ? <p className="callout-warning">Editor note: {project.changeNote}</p> : null}
          </Card>

          <Card>
            <h2>Media and attachments</h2>
            <div className="attachment-list">
              {project.coverImage ? (
                <a className="attachment-item" href={project.coverImage.dataUrl} target="_blank" rel="noreferrer">
                  <div>
                    <strong>{project.coverImage.name}</strong>
                    <p>Cover image · {formatFileSize(project.coverImage.size)}</p>
                  </div>
                </a>
              ) : null}
              {project.images.map((image) => (
                <a className="attachment-item" href={image.dataUrl} target="_blank" rel="noreferrer" key={image.id}>
                  <div>
                    <strong>{image.name}</strong>
                    <p>Image · {formatFileSize(image.size)}</p>
                  </div>
                </a>
              ))}
              {project.documents.map((document) => (
                <a className="attachment-item" href={document.dataUrl} target="_blank" rel="noreferrer" key={document.id}>
                  <div>
                    <strong>{document.name}</strong>
                    <p>PDF · {formatFileSize(document.size)}</p>
                  </div>
                </a>
              ))}
              {!project.coverImage && project.images.length === 0 && project.documents.length === 0 ? <p className="muted">No media or attachments added yet.</p> : null}
            </div>
          </Card>
        </section>

        <Card>
          <h2>Project details</h2>
          <MetaList
            items={[
              { label: 'Club', value: club?.name ?? 'Unknown club' },
              { label: 'Theme', value: theme?.name ?? 'Not set' },
              { label: 'Progress status', value: formatStatusLabel(project.projectStatus) },
              { label: 'Location', value: project.location },
              { label: 'Start date', value: formatDateLabel(project.startDate) },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { Check, Search } from 'lucide-react';
import { listClubs, listProjects, listThemes } from '@/data/api';
import { DISTRICT_CLUB_SHORT_NAME } from '@/data/model';
import { useAuth } from '@/features/auth';
import { hasPermission } from '@/features/permissions';
import { Badge, Button, Card, EmptyState, FilterChip, PageHeader, StatusBadge } from '@/ui/components';
import { ImagePreviewButton } from '@/ui/image-preview';
import { formatDateLabel, formatStatusLabel } from '@/ui/formatters';

type LevelFilter = 'all' | 'district' | 'club';

export function ProjectsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<LevelFilter>('all');
  const [clubId, setClubId] = useState('all');
  const [clubQuery, setClubQuery] = useState('');
  const [clubOpen, setClubOpen] = useState(false);
  const [themeId, setThemeId] = useState('all');
  const [themeQuery, setThemeQuery] = useState('');
  const [themeOpen, setThemeOpen] = useState(false);
  const [progress, setProgress] = useState('all');
  const [scope, setScope] = useState<'published' | 'mine'>('published');

  const projectsQuery = useQuery({ queryKey: ['projects', session?.user.id], queryFn: () => listProjects(session!), enabled: Boolean(session) });
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: listClubs });
  const themesQuery = useQuery({ queryKey: ['themes'], queryFn: listThemes });
  const isLoading = projectsQuery.isLoading || clubsQuery.isLoading || themesQuery.isLoading;

  const districtClubId = useMemo(
    () => (clubsQuery.data ?? []).find((club) => club.shortName === DISTRICT_CLUB_SHORT_NAME)?.id,
    [clubsQuery.data],
  );

  const filtered = useMemo(() => {
    return (projectsQuery.data ?? []).filter((project) => {
      const matchesScope =
        scope === 'published'
          ? project.status === 'PUBLISHED'
          : hasPermission(session, 'staff.access') && project.ownerUserId === session?.user.id;
      const matchesSearch = [project.title, project.location, project.description].join(' ').toLowerCase().includes(search.toLowerCase());
      const matchesLevel =
        level === 'all'
          ? true
          : level === 'district'
            ? Boolean(districtClubId) && project.clubId === districtClubId
            : districtClubId
              ? project.clubId !== districtClubId
              : true;
      const matchesClub = level === 'district' ? true : clubId === 'all' || project.clubId === clubId;
      const matchesTheme = themeId === 'all' || project.themeId === themeId;
      const matchesProgress = progress === 'all' || project.projectStatus === progress;
      return matchesScope && matchesSearch && matchesLevel && matchesClub && matchesTheme && matchesProgress;
    });
  }, [clubId, districtClubId, level, progress, projectsQuery.data, scope, search, session, themeId]);

  if (!session) {
    return null;
  }

  const clubLabel = clubId === 'all' ? 'All' : clubsQuery.data?.find((club) => club.id === clubId)?.shortName ?? 'All';
  const themeLabel = themeId === 'all' ? 'All' : themesQuery.data?.find((theme) => theme.id === themeId)?.name ?? 'All';
  const progressLabel = progress === 'all' ? 'All' : progress;
  const levelLabel = level === 'all' ? 'All' : level === 'district' ? 'District' : 'Club';

  return (
    <div className="page-stack">
      <PageHeader
        title="Projects"
        description="Search and filter projects."
        actions={
          hasPermission(session, 'staff.access') ? (
            <Button type="button" onClick={() => navigate('/projects/new')}>
              Create project
            </Button>
          ) : undefined
        }
      />

	      <Card>
	        <div className="filter-bar" aria-label="Project filters">
	          {hasPermission(session, 'staff.access') ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <FilterChip label="View" value={scope === 'published' ? 'Published' : 'Mine'} active={scope === 'mine'} />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="menu-content" align="start" sideOffset={8}>
                  <DropdownMenu.RadioGroup value={scope} onValueChange={(value) => setScope(value as 'published' | 'mine')}>
                    <DropdownMenu.RadioItem className="menu-item" value="published">
                      Published projects
                      <DropdownMenu.ItemIndicator>
                        <Check size={16} />
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem className="menu-item" value="mine">
                      My projects
                      <DropdownMenu.ItemIndicator>
                        <Check size={16} />
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
	          ) : null}

	          <DropdownMenu.Root>
	            <DropdownMenu.Trigger asChild>
	              <FilterChip label="Level" value={levelLabel} active={level !== 'all'} />
	            </DropdownMenu.Trigger>
	            <DropdownMenu.Portal>
	              <DropdownMenu.Content className="menu-content" align="start" sideOffset={8}>
	                <DropdownMenu.RadioGroup
	                  value={level}
	                  onValueChange={(value) => {
	                    const nextLevel = value as LevelFilter;
	                    setLevel(nextLevel);
	                    if (nextLevel === 'district') setClubId('all');
	                  }}
	                >
	                  {[
	                    { value: 'all', label: 'All projects' },
	                    { value: 'district', label: 'District projects' },
	                    { value: 'club', label: 'Club projects' },
	                  ].map((option) => (
	                    <DropdownMenu.RadioItem className="menu-item" value={option.value} key={option.value}>
	                      {option.label}
	                      <DropdownMenu.ItemIndicator>
	                        <Check size={16} />
	                      </DropdownMenu.ItemIndicator>
	                    </DropdownMenu.RadioItem>
	                  ))}
	                </DropdownMenu.RadioGroup>
	              </DropdownMenu.Content>
	            </DropdownMenu.Portal>
	          </DropdownMenu.Root>

	          <div className="filter-search" role="search">
	            <Search size={16} aria-hidden="true" />
	            <input
	              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects"
              aria-label="Search projects"
            />
          </div>

	          {level !== 'district' ? (
	            <DropdownMenu.Root
	              open={clubOpen}
	              onOpenChange={(nextOpen) => {
	                setClubOpen(nextOpen);
	                if (!nextOpen) setClubQuery('');
	              }}
	            >
	              <DropdownMenu.Trigger asChild>
	                <FilterChip label="Club" value={clubLabel} active={clubId !== 'all'} />
	              </DropdownMenu.Trigger>
	              <DropdownMenu.Portal>
	                <DropdownMenu.Content className="menu-content" align="start" sideOffset={8}>
	                  <DropdownMenu.Item className="menu-item" onSelect={(event) => event.preventDefault()} asChild>
	                    <div className="menu-search">
	                      <Search size={16} aria-hidden="true" />
	                      <input
	                        autoFocus
	                        value={clubQuery}
	                        onChange={(event) => setClubQuery(event.target.value)}
	                        placeholder="Search clubs..."
	                        aria-label="Search clubs"
	                      />
	                    </div>
	                  </DropdownMenu.Item>
	                  <div className="menu-scroll" aria-label="Club options">
	                    <DropdownMenu.RadioGroup value={clubId} onValueChange={setClubId}>
	                      <DropdownMenu.RadioItem className="menu-item" value="all">
	                        All clubs
	                        <DropdownMenu.ItemIndicator>
	                          <Check size={16} />
	                        </DropdownMenu.ItemIndicator>
	                      </DropdownMenu.RadioItem>
	                      {(clubsQuery.data ?? [])
	                        .filter((club) => club.shortName !== DISTRICT_CLUB_SHORT_NAME)
	                        .filter((club) => club.name.toLowerCase().includes(clubQuery.trim().toLowerCase()))
	                        .map((club) => (
	                          <DropdownMenu.RadioItem className="menu-item" value={club.id} key={club.id}>
	                            {club.name}
	                            <DropdownMenu.ItemIndicator>
	                              <Check size={16} />
	                            </DropdownMenu.ItemIndicator>
	                          </DropdownMenu.RadioItem>
	                        ))}
	                    </DropdownMenu.RadioGroup>
	                  </div>
	                </DropdownMenu.Content>
	              </DropdownMenu.Portal>
	            </DropdownMenu.Root>
	          ) : null}

          <DropdownMenu.Root
            open={themeOpen}
            onOpenChange={(nextOpen) => {
              setThemeOpen(nextOpen);
              if (!nextOpen) setThemeQuery('');
            }}
          >
            <DropdownMenu.Trigger asChild>
              <FilterChip label="Theme" value={themeLabel} active={themeId !== 'all'} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="menu-content" align="start" sideOffset={8}>
                <DropdownMenu.Item className="menu-item" onSelect={(event) => event.preventDefault()} asChild>
                  <div className="menu-search">
                    <Search size={16} aria-hidden="true" />
                    <input
                      autoFocus
                      value={themeQuery}
                      onChange={(event) => setThemeQuery(event.target.value)}
                      placeholder="Search themes..."
                      aria-label="Search themes"
                    />
                  </div>
                </DropdownMenu.Item>
                <div className="menu-scroll" aria-label="Theme options">
                  <DropdownMenu.RadioGroup value={themeId} onValueChange={setThemeId}>
                    <DropdownMenu.RadioItem className="menu-item" value="all">
                      All themes
                      <DropdownMenu.ItemIndicator>
                        <Check size={16} />
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                    {(themesQuery.data ?? [])
                      .filter((theme) => theme.name.toLowerCase().includes(themeQuery.trim().toLowerCase()))
                      .map((theme) => (
                        <DropdownMenu.RadioItem className="menu-item" value={theme.id} key={theme.id}>
                          {theme.name}
                          <DropdownMenu.ItemIndicator>
                            <Check size={16} />
                          </DropdownMenu.ItemIndicator>
                        </DropdownMenu.RadioItem>
                      ))}
                  </DropdownMenu.RadioGroup>
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <FilterChip label="Status" value={progressLabel} active={progress !== 'all'} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="menu-content" align="start" sideOffset={8}>
                <DropdownMenu.RadioGroup value={progress} onValueChange={setProgress}>
                  {[
                    { value: 'all', label: 'All statuses' },
                    { value: 'Planning', label: 'Planning' },
                    { value: 'Active', label: 'Active' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'Paused', label: 'Paused' },
                  ].map((option) => (
                    <DropdownMenu.RadioItem className="menu-item" value={option.value} key={option.value}>
                      {option.label}
                      <DropdownMenu.ItemIndicator>
                        <Check size={16} />
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

	          {(search || level !== 'all' || clubId !== 'all' || themeId !== 'all' || progress !== 'all') && (
	            <Button
	              type="button"
	              variant="ghost"
	              size="sm"
	              onClick={() => {
	                setSearch('');
	                setLevel('all');
	                setClubId('all');
	                setThemeId('all');
	                setProgress('all');
	              }}
	            >
	              Reset
	            </Button>
	          )}
	        </div>
	      </Card>

      <Card>
        {projectsQuery.isError ? (
          <div className="callout-warning" role="alert">
            <strong>Unable to load projects</strong>
            <p className="muted">
              {projectsQuery.error instanceof Error ? projectsQuery.error.message : 'Please refresh and try again.'}
            </p>
          </div>
        ) : isLoading ? (
          <div className="card-grid" aria-label="Loading projects">
            {Array.from({ length: 6 }).map((_, index) => (
              <article className="card skeleton-card" key={index}>
                <div className="skeleton skeleton-card-media" />
                <div className="skeleton-card-body">
                  <div className="inline-badges">
                    <span className="skeleton skeleton-pill" style={{ width: 110 }} />
                    <span className="skeleton skeleton-pill" style={{ width: 140 }} />
                  </div>
                  <div className="skeleton skeleton-line-lg" style={{ width: '82%' }} />
                  <div className="skeleton skeleton-line" style={{ width: '66%' }} />
                  <div className="skeleton skeleton-line" style={{ width: '54%' }} />
                </div>
              </article>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No projects found" description="Adjust your search or filters and try again." />
        ) : (
          <div className="card-grid" aria-label="Project results">
            {filtered.map((project) => {
              const club = clubsQuery.data?.find((entry) => entry.id === project.clubId);
              const theme = themesQuery.data?.find((entry) => entry.id === project.themeId);
              const canEditOwn = Boolean(session.permissions.includes('project.edit.own') && project.ownerUserId === session.user.id);
              return (
                <article className="card content-card" key={project.id}>
                  <div className="content-card-media">
                    {project.coverImage?.dataUrl ? <img src={project.coverImage.dataUrl} alt="" loading="lazy" /> : null}
                  </div>
                  <div className="content-card-body">
                    <div className="content-card-head">
	                      <div className="inline-badges">
	                        <Badge variant="success">{formatStatusLabel(project.projectStatus)}</Badge>
	                        {club ? (
	                          club.shortName === DISTRICT_CLUB_SHORT_NAME ? (
	                            <Badge variant="brand">District</Badge>
	                          ) : (
	                            <Badge variant="gold">{club.shortName}</Badge>
	                          )
	                        ) : null}
	                        {theme ? <Badge>{theme.name}</Badge> : null}
	                        {scope === 'published' ? null : <StatusBadge status={project.status} />}
	                      </div>
                      <div className="content-card-actions">
                        {project.coverImage?.dataUrl ? <ImagePreviewButton src={project.coverImage.dataUrl} title={project.title} /> : null}
                        {canEditOwn ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Edit project ${project.title}`}
                            onClick={() => navigate(`/projects/${project.id}/edit`)}
                          >
                            Edit
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <div className="content-card-title">{project.title}</div>
                    <div className="content-card-meta">
                      <div>{project.location}</div>
                      <div>Start date: {formatDateLabel(project.startDate)}</div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

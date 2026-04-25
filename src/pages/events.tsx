import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { Check, Search } from 'lucide-react';
import { listClubs, listEvents, listThemes } from '@/data/api';
import { DISTRICT_CLUB_SHORT_NAME } from '@/data/model';
import { useAuth } from '@/features/auth';
import { hasPermission } from '@/features/permissions';
import { Badge, Button, Card, EmptyState, FilterChip, PageHeader, StatusBadge } from '@/ui/components';
import { ImagePreviewButton } from '@/ui/image-preview';
import { formatDateTimeLabel } from '@/ui/formatters';

type LevelFilter = 'all' | 'district' | 'club';

export function EventsPage() {
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
  const [dateScope, setDateScope] = useState('all');
  const [scope, setScope] = useState<'published' | 'mine'>('published');

  const eventsQuery = useQuery({ queryKey: ['events', session?.user.id], queryFn: () => listEvents(session!), enabled: Boolean(session) });
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: listClubs });
  const themesQuery = useQuery({ queryKey: ['themes'], queryFn: listThemes });
  const isLoading = eventsQuery.isLoading || clubsQuery.isLoading || themesQuery.isLoading;

  const districtClubId = useMemo(
    () => (clubsQuery.data ?? []).find((club) => club.shortName === DISTRICT_CLUB_SHORT_NAME)?.id,
    [clubsQuery.data],
  );

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (eventsQuery.data ?? []).filter((event) => {
      const matchesScope =
        scope === 'published'
          ? event.status === 'PUBLISHED'
          : hasPermission(session, 'staff.access') && event.ownerUserId === session?.user.id;
      const matchesSearch = [event.title, event.location, event.contactPerson].join(' ').toLowerCase().includes(search.toLowerCase());
      const matchesLevel =
        level === 'all'
          ? true
          : level === 'district'
            ? Boolean(districtClubId) && event.clubId === districtClubId
            : districtClubId
              ? event.clubId !== districtClubId
              : true;
      const matchesClub = level === 'district' ? true : clubId === 'all' || event.clubId === clubId;
      const matchesTheme = themeId === 'all' || event.themeId === themeId;
      const matchesDate =
        dateScope === 'all' ||
        (dateScope === 'upcoming' && event.date >= today) ||
        (dateScope === 'past' && event.date < today);
      return matchesScope && matchesSearch && matchesLevel && matchesClub && matchesTheme && matchesDate;
    });
  }, [clubId, dateScope, districtClubId, eventsQuery.data, level, scope, search, session, themeId]);

  if (!session) {
    return null;
  }

  const clubLabel = clubId === 'all' ? 'All' : clubsQuery.data?.find((club) => club.id === clubId)?.shortName ?? 'All';
  const themeLabel = themeId === 'all' ? 'All' : themesQuery.data?.find((theme) => theme.id === themeId)?.name ?? 'All';
  const dateLabel =
    dateScope === 'all' ? 'All' : dateScope === 'upcoming' ? 'Upcoming' : dateScope === 'past' ? 'Past' : 'All';
  const levelLabel = level === 'all' ? 'All' : level === 'district' ? 'District' : 'Club';

  return (
    <div className="page-stack">
      <PageHeader
        title="Events"
        description="Search and filter events."
        actions={
          hasPermission(session, 'staff.access') ? (
            <Button type="button" onClick={() => navigate('/events/new')}>
              Create event
            </Button>
          ) : undefined
        }
      />

	      <Card>
	        <div className="filter-bar" aria-label="Event filters">
	          {hasPermission(session, 'staff.access') ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <FilterChip label="View" value={scope === 'published' ? 'Published' : 'Mine'} active={scope === 'mine'} />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="menu-content" align="start" sideOffset={8}>
                  <DropdownMenu.RadioGroup value={scope} onValueChange={(value) => setScope(value as 'published' | 'mine')}>
                    <DropdownMenu.RadioItem className="menu-item" value="published">
                      Published events
                      <DropdownMenu.ItemIndicator>
                        <Check size={16} />
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem className="menu-item" value="mine">
                      My events
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
	                    { value: 'all', label: 'All events' },
	                    { value: 'district', label: 'District events' },
	                    { value: 'club', label: 'Club events' },
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
              placeholder="Search events"
              aria-label="Search events"
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
	                        onKeyDown={(event) => {
	                          if (event.key !== 'Escape') event.stopPropagation();
	                        }}
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
                      onKeyDown={(event) => {
                        if (event.key !== 'Escape') event.stopPropagation();
                      }}
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
              <FilterChip label="Date" value={dateLabel} active={dateScope !== 'all'} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="menu-content" align="start" sideOffset={8}>
                <DropdownMenu.RadioGroup value={dateScope} onValueChange={setDateScope}>
                  {[
                    { value: 'all', label: 'All dates' },
                    { value: 'upcoming', label: 'Upcoming' },
                    { value: 'past', label: 'Past' },
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

	          {(search || level !== 'all' || clubId !== 'all' || themeId !== 'all' || dateScope !== 'all') && (
	            <Button
	              type="button"
	              variant="ghost"
	              size="sm"
	              onClick={() => {
	                setSearch('');
	                setLevel('all');
	                setClubId('all');
	                setThemeId('all');
	                setDateScope('all');
	              }}
	            >
	              Reset
	            </Button>
	          )}
	        </div>
	      </Card>

      <Card>
        {eventsQuery.isError ? (
          <div className="callout-warning" role="alert">
            <strong>Unable to load events</strong>
            <p className="muted">
              {eventsQuery.error instanceof Error ? eventsQuery.error.message : 'Please refresh and try again.'}
            </p>
          </div>
        ) : isLoading ? (
          <div className="card-grid" aria-label="Loading events">
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
          <EmptyState title="No events found" description="Adjust your search or filters and try again." />
        ) : (
          <div className="card-grid" aria-label="Event results">
            {filtered.map((event) => {
              const club = clubsQuery.data?.find((entry) => entry.id === event.clubId);
              const theme = themesQuery.data?.find((entry) => entry.id === event.themeId);
              const canEditOwn = Boolean(session.permissions.includes('event.edit.own') && event.ownerUserId === session.user.id);
              return (
                <article className="card content-card" key={event.id}>
                  <div className="content-card-media">
                    {event.flyer?.dataUrl ? <img src={event.flyer.dataUrl} alt="" loading="lazy" /> : null}
                  </div>
                  <div className="content-card-body">
                    <div className="content-card-head">
	                      <div className="inline-badges">
	                        {club ? (
	                          club.shortName === DISTRICT_CLUB_SHORT_NAME ? (
	                            <Badge variant="brand">District</Badge>
	                          ) : (
	                            <Badge variant="gold">{club.shortName}</Badge>
	                          )
	                        ) : null}
	                        {theme ? <Badge>{theme.name}</Badge> : null}
	                        {scope === 'published' ? null : <StatusBadge status={event.status} />}
	                      </div>
                      <div className="content-card-actions">
                        {event.flyer?.dataUrl ? <ImagePreviewButton src={event.flyer.dataUrl} title={event.title} /> : null}
                        {canEditOwn ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Edit event ${event.title}`}
                            onClick={() => navigate(`/events/${event.id}/edit`)}
                          >
                            Edit
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <div className="content-card-title">{event.title}</div>
                    <div className="content-card-meta">
                      <div>{formatDateTimeLabel(event.date, event.time, event.isAllDay)}</div>
                      <div>{event.location}</div>
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

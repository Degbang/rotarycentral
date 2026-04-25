import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { Check, Search } from 'lucide-react';
import { listAnnouncements, listClubs } from '@/data/api';
import { DISTRICT_CLUB_SHORT_NAME } from '@/data/model';
import { useAuth } from '@/features/auth';
import { hasPermission } from '@/features/permissions';
import { Badge, Button, Card, EmptyState, FilterChip, PageHeader } from '@/ui/components';

type LevelFilter = 'all' | 'district' | 'club';

export function AnnouncementsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<LevelFilter>('all');
  const [clubId, setClubId] = useState('all');
  const [clubQuery, setClubQuery] = useState('');
  const [clubOpen, setClubOpen] = useState(false);

  const announcementsQuery = useQuery({
    queryKey: ['announcements', session?.user.id],
    queryFn: () => listAnnouncements(session!),
    enabled: Boolean(session),
  });
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: listClubs });

  const isLoading = announcementsQuery.isLoading || clubsQuery.isLoading;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (announcementsQuery.data ?? []).filter((announcement) => {
      if (announcement.status !== 'PUBLISHED') return false;
      const matchesSearch = !q || [announcement.title, announcement.body].join(' ').toLowerCase().includes(q);
      const matchesLevel =
        level === 'all'
          ? true
          : level === 'district'
            ? announcement.scope === 'DISTRICT'
            : announcement.scope === 'CLUB';
      const matchesClub = level === 'district' ? true : clubId === 'all' ? true : announcement.clubId === clubId;
      return matchesSearch && matchesLevel && matchesClub;
    });
  }, [announcementsQuery.data, clubId, level, search]);

  if (!session) return null;

  const clubLabel = clubId === 'all' ? 'All' : clubsQuery.data?.find((club) => club.id === clubId)?.shortName ?? 'All';
  const isStaff = hasPermission(session, 'staff.access');
  const levelLabel = level === 'all' ? 'All' : level === 'district' ? 'District' : 'Club';

  return (
    <div className="page-stack">
      <PageHeader
        title="Announcements"
        description="District and club updates."
        actions={
          isStaff ? (
            <Button type="button" onClick={() => navigate('/announcements/new')}>
              Post announcement
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="filter-bar" aria-label="Announcement filters">
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
	                    { value: 'all', label: 'All announcements' },
	                    { value: 'district', label: 'District announcements' },
	                    { value: 'club', label: 'Club announcements' },
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
              placeholder="Search announcements"
              aria-label="Search announcements"
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
	                            {club.shortName}
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

	          {(search || level !== 'all' || clubId !== 'all') && (
	            <Button
	              type="button"
	              variant="ghost"
	              size="sm"
	              onClick={() => {
	                setSearch('');
	                setLevel('all');
	                setClubId('all');
	              }}
	            >
	              Reset
	            </Button>
	          )}
        </div>
      </Card>

      <Card>
        {announcementsQuery.isError ? (
          <div className="callout-warning" role="alert">
            <strong>Unable to load announcements</strong>
            <p className="muted">
              {announcementsQuery.error instanceof Error ? announcementsQuery.error.message : 'Please refresh and try again.'}
            </p>
          </div>
        ) : isLoading ? (
          <div className="stack-list" aria-label="Loading announcements">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="list-row skeleton-card" key={index} style={{ padding: '1.1rem' }}>
                <div className="skeleton skeleton-line-lg" style={{ width: '60%' }} />
                <div className="skeleton skeleton-line" style={{ width: '85%', marginTop: 10 }} />
                <div className="skeleton skeleton-line" style={{ width: '75%', marginTop: 8 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No announcements found" description="Adjust your search or filters and try again." />
        ) : (
          <div className="stack-list" aria-label="Announcement results">
            {filtered.map((announcement) => {
              const club = announcement.clubId ? clubsQuery.data?.find((entry) => entry.id === announcement.clubId) : null;
              return (
                <article className="list-row" key={announcement.id}>
                  <div className="inline-badges">
                    {announcement.scope === 'DISTRICT' ? (
                      <Badge variant="brand">District</Badge>
                    ) : (
                      <Badge variant="gold">{club?.shortName ?? 'Club'}</Badge>
                    )}
                  </div>
                  <h3 style={{ marginTop: 8 }}>{announcement.title}</h3>
                  <p className="muted" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>
                    {announcement.body}
                  </p>
                  {isStaff && announcement.ownerUserId === session.user.id ? (
                    <div className="inline-actions" style={{ marginTop: 12 }}>
                      <Button type="button" variant="secondary" size="sm" onClick={() => navigate(`/announcements/${announcement.id}/edit`)}>
                        Edit
                      </Button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

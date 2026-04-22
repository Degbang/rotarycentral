import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CalendarDays, FolderKanban, Plus } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button, UserPill } from '@/ui/components';
import districtLogo from '@/assets/rd9104-logo.png';
import { InstallButton } from '@/ui/install-button';

const baseNavigation = [
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
];

export function AppShell() {
  const { session, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!session) {
    return null;
  }

  const navigation = [...baseNavigation];
  const isStaff = hasPermission('staff.access');

  const pageTitle = navigation.find((item) => location.pathname.startsWith(item.to))?.label ?? 'Workspace';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <button className="brand-lockup" type="button" onClick={() => navigate('/events')}>
            <span className="brand-mark" aria-hidden="true">
              <img className="brand-logo" src={districtLogo} alt="" />
            </span>
            <div className="brand-copy">
              <span className="eyebrow">Rotary District 9104</span>
              <strong>Ghana</strong>
            </div>
          </button>
          <nav className="topnav" aria-label="Primary">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'topnav-link topnav-link-active' : 'topnav-link')}>
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="topbar-right">
          <InstallButton variant="ghost" />
          {isStaff ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button type="button" variant="secondary" size="sm">
                  <Plus size={16} />
                  Add
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="menu-content" align="end" sideOffset={8}>
                  <DropdownMenu.Item className="menu-item" onSelect={() => navigate('/events/new')}>
                    Create event
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="menu-item" onSelect={() => navigate('/projects/new')}>
                    Create project
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : null}

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="user-menu-button" type="button">
                <UserPill name={session.user.displayName} detail={session.roles.join(', ')} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="menu-content" align="end" sideOffset={8}>
                <DropdownMenu.Item className="menu-item" onSelect={() => navigate('/events')}>
                  Go to events
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="menu-separator" />
                <DropdownMenu.Item
                  className="menu-item menu-item-danger"
                  onSelect={async () => {
                    await logout();
                    navigate('/login');
                  }}
                >
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Mobile primary">
        {navigation.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'bottom-link bottom-link-active' : 'bottom-link')}>
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

// Application shell: skip link, banner with primary navigation, and the main
// landmark that wraps every route. Provides the semantic structure assistive
// technology relies on.
import { NavLink, Outlet } from 'react-router-dom';

/** Navigation entries for the two personas. */
const NAV_ITEMS = [
  { to: '/assistant', label: 'Fan Assistant' },
  { to: '/operations', label: 'Operations' },
] as const;

/** Top-level layout rendered around every route. */
export function AppLayout(): React.JSX.Element {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="app-header">
        <div className="app-header__inner">
          <NavLink to="/" className="brand">
            Stadium<span>IQ</span>
          </NavLink>
          <nav className="primary-nav" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content" className="main" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}

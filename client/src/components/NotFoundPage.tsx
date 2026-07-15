// Accessible not-found view: mistyped URLs get an honest 404 message with
// paths back to both personas instead of silently rendering the home page.
import { Link } from 'react-router-dom';

/** Fallback route for URLs that match nothing. */
export function NotFoundPage(): React.JSX.Element {
  return (
    <section aria-labelledby="not-found-heading" className="stack">
      <h1 id="not-found-heading">Page not found</h1>
      <p className="page-intro">
        That address does not match any StadiumIQ page. Head back to the{' '}
        <Link to="/">home page</Link>, ask the <Link to="/assistant">Fan Assistant</Link>, or open
        the <Link to="/operations">Operations Command Center</Link>.
      </p>
    </section>
  );
}

// Landing page: a short orientation and entry points into the two personas.
import { Link } from 'react-router-dom';

/** Home route introducing StadiumIQ and linking to both experiences. */
export function HomePage(): React.JSX.Element {
  return (
    <section aria-labelledby="home-heading" className="stack">
      <div>
        <h1 id="home-heading">Smart Stadiums &amp; Tournament Operations</h1>
        <p className="page-intro">
          StadiumIQ is a GenAI platform for the FIFA World Cup 2026 at Estadio Azteca. Fans get
          multilingual navigation, accessibility and transport help; organizers get live crowd
          intelligence and AI-generated operational briefings.
        </p>
      </div>
      <div className="grid-two">
        <div className="card stack">
          <h2>For fans</h2>
          <p className="muted">
            Ask for your gate, a step-free route, the nearest prayer room or how to reach the metro
            — answered from official venue data in five languages.
          </p>
          <p>
            <Link className="button" to="/assistant">
              Open the Fan Assistant
            </Link>
          </p>
        </div>
        <div className="card stack">
          <h2>For organizers</h2>
          <p className="muted">
            Monitor zone crowd density, track incidents and sustainability, and generate a
            prioritized AI briefing for real-time decisions.
          </p>
          <p>
            <Link className="button" to="/operations">
              Open Operations
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

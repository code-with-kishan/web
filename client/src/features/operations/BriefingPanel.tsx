// AI briefing panel: a button that turns the live snapshot into prioritized
// operational recommendations, with accessible loading and error states.
import { ErrorMessage, LoadingState } from '../../components/StatusMessage.js';
import type { OpsBriefing } from '../../lib/api-types.js';

interface BriefingPanelProps {
  briefing: OpsBriefing | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

/** Generate-and-display panel for the AI operations briefing. */
export function BriefingPanel({
  briefing,
  isLoading,
  error,
  onGenerate,
}: BriefingPanelProps): React.JSX.Element {
  return (
    <div className="card stack">
      <div>
        <h2>AI Operations Briefing</h2>
        <p className="muted">
          Generate prioritized crowd, incident and sustainability actions from the current live
          snapshot — real-time decision support for the operations director.
        </p>
      </div>
      <button type="button" className="button" onClick={onGenerate} disabled={isLoading}>
        {isLoading ? 'Generating…' : 'Generate AI briefing'}
      </button>

      {isLoading ? <LoadingState label="Analysing live venue data…" /> : null}
      {error !== null ? <ErrorMessage message={error} /> : null}

      {briefing !== null && !isLoading ? (
        <div aria-live="polite">
          <p className="muted briefing__timestamp">
            Generated {new Date(briefing.generatedAt).toLocaleTimeString()}
          </p>
          <p className="briefing">{briefing.briefing}</p>
        </div>
      ) : null}
    </div>
  );
}

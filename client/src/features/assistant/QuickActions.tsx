// Quick-action chips: common questions a fan can ask with one tap.
import { QUICK_ACTIONS } from './assistant-content.js';

interface QuickActionsProps {
  onSelect: (question: string) => void;
  disabled: boolean;
}

/** Row of one-tap suggested questions. */
export function QuickActions({ onSelect, disabled }: QuickActionsProps): React.JSX.Element {
  return (
    <div>
      <h2 className="field-label" id="quick-actions-heading">
        Quick questions
      </h2>
      <ul className="quick-actions" aria-labelledby="quick-actions-heading">
        {QUICK_ACTIONS.map((question) => (
          <li key={question}>
            <button
              type="button"
              className="chip"
              disabled={disabled}
              onClick={() => {
                onSelect(question);
              }}
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

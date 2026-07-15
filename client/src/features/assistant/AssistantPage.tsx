// Matchday Fan Assistant page: a multilingual, grounded Q&A experience
// covering navigation, accessibility, transport and venue facilities.
import { useState } from 'react';

import { ErrorMessage, LoadingState } from '../../components/StatusMessage.js';
import { MAX_QUESTION_LENGTH } from '../../lib/constants.js';
import { ChatMessageList } from './ChatMessageList.js';
import { LanguageSelector } from './LanguageSelector.js';
import { QuickActions } from './QuickActions.js';
import { useAssistant } from './useAssistant.js';

/** Full fan assistant route. */
export function AssistantPage(): React.JSX.Element {
  const { turns, language, isLoading, error, setLanguage, ask } = useAssistant();
  const [draft, setDraft] = useState('');

  const runQuickAction = (question: string): void => {
    void ask(question);
  };

  return (
    <section aria-labelledby="assistant-heading" className="stack">
      <div>
        <h1 id="assistant-heading">Matchday Fan Assistant</h1>
        <p className="page-intro">
          Ask about gates, accessible routes, transport, food, prayer and family facilities at
          Estadio Azteca. Answers come from official venue data, in your language.
        </p>
      </div>

      <div className="card stack">
        <LanguageSelector value={language} onChange={setLanguage} disabled={isLoading} />
        <QuickActions onSelect={runQuickAction} disabled={isLoading} />

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void ask(draft).then(() => {
              setDraft('');
            });
          }}
        >
          <label className="field-label" htmlFor="assistant-question">
            Your question
          </label>
          <input
            id="assistant-question"
            className="text-input"
            type="text"
            dir="auto"
            value={draft}
            maxLength={MAX_QUESTION_LENGTH}
            placeholder="e.g. Where is the accessible entrance?"
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            disabled={isLoading}
          />
          <p className="form-actions">
            <button type="submit" className="button" disabled={isLoading || draft.trim() === ''}>
              {isLoading ? 'Asking…' : 'Ask StadiumIQ'}
            </button>
          </p>
        </form>

        {isLoading ? <LoadingState label="Finding the best answer…" /> : null}
        {error !== null ? <ErrorMessage message={error} /> : null}
      </div>

      <div className="card">
        <h2>Conversation</h2>
        <ChatMessageList turns={turns} />
      </div>
    </section>
  );
}

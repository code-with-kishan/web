// Renders the assistant conversation. New answers are announced politely via
// aria-live so screen-reader users hear responses without moving focus.
import type { ChatTurn } from './useAssistant.js';

interface ChatMessageListProps {
  turns: ChatTurn[];
}

const ROLE_LABEL: Record<ChatTurn['role'], string> = {
  fan: 'You asked',
  assistant: 'StadiumIQ',
};

/** Accessible, live-updating transcript of the fan conversation. */
export function ChatMessageList({ turns }: ChatMessageListProps): React.JSX.Element {
  if (turns.length === 0) {
    return (
      <p className="muted" aria-live="polite">
        Ask a question or pick one above to get matchday directions, accessibility guidance and
        transport help.
      </p>
    );
  }

  return (
    <ul className="chat-log" aria-live="polite" aria-label="Conversation">
      {turns.map((turn) => (
        <li key={turn.id} className={`chat-message chat-message--${turn.role}`}>
          <p className="chat-message__role">{ROLE_LABEL[turn.role]}</p>
          {/* dir="auto" keeps right-to-left content (Arabic) reading correctly;
              lang tells screen readers which phonetics to use (WCAG 3.1.2). */}
          <p className="chat-message__body" dir="auto" lang={turn.language}>
            {turn.text}
          </p>
        </li>
      ))}
    </ul>
  );
}

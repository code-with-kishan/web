// State and side effects for the fan assistant conversation. Keeps the page
// component declarative: it renders whatever this hook exposes.
import { useCallback, useState } from 'react';

import { askAssistant, toErrorMessage } from '../../lib/api.js';
import type { SupportedLanguage } from '../../lib/api-types.js';

/** A single turn in the assistant conversation. */
export interface ChatTurn {
  id: string;
  role: 'fan' | 'assistant';
  text: string;
  /** BCP 47 tag of the turn's content (assistant turns), for WCAG 3.1.2. */
  language?: SupportedLanguage;
}

interface UseAssistantResult {
  turns: ChatTurn[];
  language: SupportedLanguage;
  isLoading: boolean;
  error: string | null;
  setLanguage: (language: SupportedLanguage) => void;
  ask: (question: string) => Promise<void>;
}

/** Manages the assistant conversation, language selection and request state. */
export function useAssistant(): UseAssistantResult {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(
    async (question: string): Promise<void> => {
      const trimmed = question.trim();
      if (trimmed === '' || isLoading) {
        return;
      }
      setError(null);
      setIsLoading(true);
      setTurns((prev) => [...prev, { id: crypto.randomUUID(), role: 'fan', text: trimmed }]);
      try {
        const result = await askAssistant(trimmed, language);
        setTurns((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: result.answer,
            language: result.language,
          },
        ]);
      } catch (caught) {
        setError(
          toErrorMessage(caught, 'The assistant is unavailable right now. Please try again.'),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [language, isLoading],
  );

  return { turns, language, isLoading, error, setLanguage, ask };
}

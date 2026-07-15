// Language selector for the assistant. A labelled native <select> so it is
// keyboard-complete and screen-reader friendly with no custom widget code.
import type { SupportedLanguage } from '../../lib/api-types.js';
import { LANGUAGE_OPTIONS, parseLanguage } from './assistant-content.js';

interface LanguageSelectorProps {
  value: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
  disabled: boolean;
}

/** Accessible dropdown for choosing the assistant's answer language. */
export function LanguageSelector({
  value,
  onChange,
  disabled,
}: LanguageSelectorProps): React.JSX.Element {
  return (
    <div>
      <label className="field-label" htmlFor="assistant-language">
        Answer language
      </label>
      <select
        id="assistant-language"
        className="select-input"
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(parseLanguage(event.target.value));
        }}
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

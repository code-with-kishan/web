// Shared status surfaces: a loading indicator and an error panel, both
// announced to assistive technology via the appropriate ARIA roles.

interface LoadingStateProps {
  label: string;
}

/** Accessible busy indicator with a spinner and a visible label. */
export function LoadingState({ label }: LoadingStateProps): React.JSX.Element {
  return (
    <p className="status-message" role="status">
      <span className="spinner" aria-hidden="true" /> {label}
    </p>
  );
}

interface ErrorMessageProps {
  message: string;
}

/** Accessible error panel announced through role="alert". */
export function ErrorMessage({ message }: ErrorMessageProps): React.JSX.Element {
  return (
    <p className="status-message status-message--error" role="alert">
      {message}
    </p>
  );
}

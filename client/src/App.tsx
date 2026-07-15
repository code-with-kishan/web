// Route configuration with route-level code splitting: each persona page is
// lazily loaded so the initial route ships minimal JavaScript.
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/AppLayout.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { NotFoundPage } from './components/NotFoundPage.js';
import { LoadingState } from './components/StatusMessage.js';
import { HomePage } from './features/home/HomePage.js';

const AssistantPage = lazy(() =>
  import('./features/assistant/AssistantPage.js').then((module) => ({
    default: module.AssistantPage,
  })),
);
const OperationsPage = lazy(() =>
  import('./features/operations/OperationsPage.js').then((module) => ({
    default: module.OperationsPage,
  })),
);

/** Root application component wiring routes, layout and error handling. */
export function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route
            path="assistant"
            element={
              <Suspense fallback={<LoadingState label="Loading the assistant…" />}>
                <AssistantPage />
              </Suspense>
            }
          />
          <Route
            path="operations"
            element={
              <Suspense fallback={<LoadingState label="Loading operations…" />}>
                <OperationsPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

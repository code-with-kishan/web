import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AssistantPage } from '../../../src/features/assistant/AssistantPage.js';
import * as api from '../../../src/lib/api.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AssistantPage', () => {
  it('sends a typed question and renders the grounded answer', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'askAssistant').mockResolvedValue({
      answer: 'Use Gate 6 for step-free access.',
      language: 'en',
      cached: false,
    });

    render(<AssistantPage />);
    await user.type(screen.getByLabelText('Your question'), 'Where is the accessible entrance?');
    await user.click(screen.getByRole('button', { name: 'Ask StadiumIQ' }));

    const conversation = await screen.findByRole('list', { name: 'Conversation' });
    expect(within(conversation).getByText('Use Gate 6 for step-free access.')).toBeInTheDocument();
  });

  it('runs a quick action without typing', async () => {
    const user = userEvent.setup();
    const ask = vi.spyOn(api, 'askAssistant').mockResolvedValue({
      answer: 'The prayer room is on Level 2.',
      language: 'en',
      cached: false,
    });

    render(<AssistantPage />);
    await user.click(screen.getByRole('button', { name: /nearest prayer room/i }));

    await waitFor(() => {
      expect(ask).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('The prayer room is on Level 2.')).toBeInTheDocument();
  });

  it('shows an accessible error when the assistant fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'askAssistant').mockRejectedValue(
      new api.ApiError('GEMINI_UNAVAILABLE', 'The AI service is temporarily unavailable.'),
    );

    render(<AssistantPage />);
    await user.type(screen.getByLabelText('Your question'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Ask StadiumIQ' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('temporarily unavailable');
  });

  it('passes the selected language through to the API', async () => {
    const user = userEvent.setup();
    const ask = vi.spyOn(api, 'askAssistant').mockResolvedValue({
      answer: 'La Puerta 6 es accesible.',
      language: 'es',
      cached: false,
    });

    render(<AssistantPage />);
    await user.selectOptions(screen.getByLabelText('Answer language'), 'es');
    await user.type(screen.getByLabelText('Your question'), 'acceso accesible');
    await user.click(screen.getByRole('button', { name: 'Ask StadiumIQ' }));

    await waitFor(() => {
      expect(ask).toHaveBeenCalledWith('acceso accesible', 'es');
    });
  });
});

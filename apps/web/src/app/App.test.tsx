import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { AuthProvider } from '../features/auth/AuthProvider';
import { renderWithProviders } from '../test/render';

describe('protected routes', () => {
  it('redirects anonymous users to sign in', async () => {
    renderWithProviders(
      <AuthProvider>
        <App />
      </AuthProvider>,
      { route: '/workflows' },
    );

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });
});

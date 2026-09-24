import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { AuthProvider } from '../features/auth/AuthProvider';
import { renderWithProviders } from '../test/render';

describe('protected routes', () => {
  it('redirects anonymous users from protected routes to sign in', async () => {
    renderWithProviders(
      <AuthProvider>
        <App />
      </AuthProvider>,
      { route: '/workflows' },
    );

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('redirects anonymous users from the dashboard URL to sign in', async () => {
    renderWithProviders(
      <AuthProvider>
        <App />
      </AuthProvider>,
      { route: '/dashboard' },
    );

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('redirects anonymous users from unknown URLs to sign in', async () => {
    renderWithProviders(
      <AuthProvider>
        <App />
      </AuthProvider>,
      { route: '/anything-direct' },
    );

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });
});

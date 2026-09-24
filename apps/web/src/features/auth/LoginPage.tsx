import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { ApiError } from '../../services/apiClient';
import flowPilotLogo from '../../assets/flowpilot-logo.png';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@flowpilot.local');
  const [password, setPassword] = useState('demo-password');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel" aria-label="FlowPilot AI sign in">
        <div className="brand-lockup">
          <img className="brand-logo login-logo" src={flowPilotLogo} alt="FlowPilot AI" />
          <div>
            <strong>FlowPilot AI</strong>
            <span>Workflow operations console</span>
          </div>
        </div>
        <div className="auth-copy">
          <h1>Sign in</h1>
          <p>Manage workflows, executions, human tasks, and system status from one control surface.</p>
        </div>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Email
            <span className="input-shell">
              <Mail size={16} />
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
            </span>
          </label>
          <label>
            Password
            <span className="input-shell">
              <Lock size={16} />
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
            </span>
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

import React, { useState } from 'react';
import { authRequest, goToRolePage, saveSession } from '../auth.js';

export default function Login() {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const session = await authRequest('login', {
        email: form.get('email'),
        password: form.get('password'),
      });
      saveSession(session);
      goToRolePage(session.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="account-page">
      <form className="account-card" onSubmit={handleSubmit}>
        <a className="account-back" href="/" data-route>? BTR Rwamiko TSS</a>
        <div className="eyebrow"><span className="eyebrow-dot" /> WELCOME BACK</div>
        <h1>Log in</h1>
        <p>Sign in to continue to your school account.</p>
        <section className="account-section">
          <h2>Account details</h2>
          <div className="account-fields">
            <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          </div>
        </section>
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Log in'}</button>
        <div className="account-switch">New to BTR? <a href="/register" data-route>Create an account</a></div>
      </form>
    </main>
  );
}
